# PDF 파일 업로드 및 미리보기 기능 구현 계획서

## 1. 기능 개요

PDF 파일을 업로드하고, 업로드된 PDF의 첫 페이지를 썸네일로 미리보기하는 기능.
본 문서는 `file-download-board` 프로젝트의 구현을 분석하여, 다른 어플리케이션에 동일 기능을 이식할 수 있도록 작성되었다.

### 전제 조건

이 기능을 이식하려면 다음 기술 스택이 필요하다:

- **프론트엔드**: React (필수) — PDF 미리보기에 `react-pdf` 라이브러리를 사용하므로 React 환경이 필수
- **백엔드**: Node.js — 파일시스템 기반 업로드 처리 및 `sharp` 이미지 변환에 Node.js 런타임 필요
- **프레임워크**: Next.js App Router 기준으로 작성되었으나, React + Node.js 조합이면 Express 등 다른 프레임워크에서도 적용 가능 (API 라우팅 방식만 변경)

## 2. 아키텍처 구성도

```
┌─────────────────────────────────────────────────────────┐
│  클라이언트 (브라우저)                                      │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────┐       │
│  │ FileUpload   │    │ FilePreview              │       │
│  │ (업로드 UI)   │    │  ├─ ImagePreview (이미지) │       │
│  │              │    │  └─ PdfPreview (PDF)      │       │
│  └──────┬───────┘    └──────────┬───────────────┘       │
│         │                       │                       │
└─────────┼───────────────────────┼───────────────────────┘
          │ POST /api/upload      │ GET /api/files/:id/preview
          ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│  서버 (Next.js API Routes)                               │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────┐       │
│  │ upload/      │    │ files/[id]/preview/       │       │
│  │ route.ts     │    │ route.ts                  │       │
│  │              │    │                           │       │
│  │ FormData     │    │ PDF → 썸네일 이미지 반환     │       │
│  │ → 디스크 저장  │    │ 이미지 → sharp 리사이즈     │       │
│  └──────┬───────┘    └──────────┬───────────────┘       │
│         │                       │                       │
│         ▼                       ▼                       │
│  ┌────────────┐         ┌────────────┐                  │
│  │ 파일시스템   │         │ 파일시스템   │                  │
│  │ /uploads/  │         │ /uploads/  │                  │
│  └────────────┘         └────────────┘                  │
│         │                                               │
│         ▼                                               │
│  ┌────────────┐                                         │
│  │ DB (File)  │  파일 메타데이터 저장                      │
│  └────────────┘                                         │
└─────────────────────────────────────────────────────────┘
```

## 3. 핵심 구성 요소

### 3.1 데이터 모델 (DB 스키마)

파일 메타데이터를 저장하는 테이블이 필요하다.

```sql
CREATE TABLE files (
  id           TEXT PRIMARY KEY,    -- cuid 또는 uuid
  original_name TEXT NOT NULL,       -- 원본 파일명
  stored_name  TEXT NOT NULL,        -- 저장된 파일명 (uuid + 확장자)
  mime_type    TEXT NOT NULL,        -- MIME 타입 (application/pdf 등)
  size         INTEGER NOT NULL,     -- 파일 크기 (bytes)
  path         TEXT NOT NULL,        -- 서버 내 저장 경로
  created_at   TIMESTAMP DEFAULT NOW(),
  post_id      TEXT REFERENCES posts(id) ON DELETE CASCADE
);

-- 성능을 위한 인덱스
CREATE INDEX idx_files_post_id ON files(post_id);
CREATE INDEX idx_files_mime_type ON files(mime_type);
```

핵심 필드:
- `mime_type`: 파일 종류를 판별하여 미리보기 방식을 결정
- `path`: 서버 내 실제 저장 경로 (미리보기 API에서 파일을 읽을 때 사용)
- `stored_name`: UUID 기반으로 파일명 충돌 방지

### 3.2 파일 저장 전략

```
uploads/
  └── 2026-03/           ← 년-월 기반 디렉토리 분리
      ├── a1b2c3d4.pdf
      └── e5f6g7h8.png
```

- 연월 기반 디렉토리로 분류하여 단일 폴더 내 파일 수 증가 방지
- 파일명은 UUID v4로 생성하여 충돌 및 보안 이슈 방지
- `fs.mkdir(dir, { recursive: true })`로 디렉토리 자동 생성

파일 보존/삭제 정책:
- 게시글 삭제 시 연결된 파일도 함께 삭제 (DB의 `ON DELETE CASCADE` + 파일시스템에서 물리 삭제)
- 고아 파일(DB 레코드 없이 남은 파일) 정리를 위한 cleanup cron job 구현 권장
- 파일 보존 기간이 필요한 경우 `deleted_at` 소프트 삭제 필드 추가 검토

### 3.3 환경 변수

```env
UPLOAD_DIR="./uploads"                                        # 파일 저장 루트 경로
MAX_FILE_SIZE=10485760                                        # 최대 파일 크기 (10MB)
MAX_FILES_PER_POST=5                                          # 게시글당 최대 파일 수
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/webp  # 허용 MIME 타입
```

> **보안 주의**: `ALLOWED_MIME_TYPES`를 반드시 설정하여 허용 파일 타입을 제한해야 한다. 미설정 시 실행 파일(.exe, .sh 등) 업로드가 가능하여 보안 위험이 발생한다.

## 4. 백엔드 API 설계

### 4.1 파일 업로드 API

**`POST /api/upload`**

| 항목 | 내용 |
|------|------|
| 인증 | 필수 (로그인 사용자만) |
| Content-Type | multipart/form-data |
| 요청 바디 | `files` 필드에 File 객체 배열 |

처리 흐름:
1. 인증 확인
2. FormData에서 파일 추출
3. 파일 수 제한 검증 (기본 5개)
4. 각 파일에 대해:
   - MIME 타입 화이트리스트 검증 (`ALLOWED_MIME_TYPES`)
   - Magic bytes 검증 (예: PDF는 `%PDF-` 헤더, JPEG는 `FF D8 FF`)
   - 파일 크기 검증 (기본 10MB)
   - 연월 기반 디렉토리 생성
   - UUID 파일명 생성
   - 디스크에 저장
5. 저장 결과 반환

응답 예시:
```json
{
  "files": [
    {
      "originalName": "report.pdf",
      "storedName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "mimeType": "application/pdf",
      "size": 2048576
    }
  ]
}
```

> **보안 주의**: 응답에 서버 내부 파일 경로(`path`)를 포함하지 않는다. `path`는 서버 내부에서만 사용하며, 클라이언트에는 파일 ID 기반 API URL만 제공한다. Docker 컨테이너 환경에서도 호스트 경로가 노출되지 않도록 주의가 필요하다.

### 4.2 PDF 미리보기 API

**`GET /api/files/:id/preview`**

| 항목 | 내용 |
|------|------|
| 인증 | 불필요 (미리보기 전용) |
| 응답 | 썸네일 이미지 (권장) 또는 PDF 원본 |

**권장 방식 — 서버 사이드 썸네일 생성:**

PDF 원본 전체를 클라이언트에 전송하는 대신, 서버에서 첫 페이지를 이미지로 변환하여 반환한다. 수십 MB의 PDF를 썸네일 용도로 전송하는 것은 비효율적이다.

```
PDF 미리보기 처리 흐름:
1. DB에서 파일 메타데이터 조회
2. mimeType이 미리보기 지원 타입인지 확인 (이미지, PDF)
3. 파일시스템에 파일 존재 여부 확인
4. PDF인 경우:
   - 서버에서 첫 페이지를 이미지(PNG/WebP)로 변환 (pdf-to-img, pdf-poppler 등)
   - 변환된 이미지를 캐싱하여 반복 변환 방지
   - 이미지로 응답
5. 이미지인 경우: sharp 라이브러리로 리사이즈 후 WebP 변환하여 반환
```

PDF 썸네일 변환 라이브러리 옵션:
- `pdf-to-img`: Node.js 네이티브, 별도 의존성 없음
- `pdf-poppler`: poppler 바이너리 필요, 품질 우수
- `sharp` + `pdf.js`: PDF → Canvas → sharp 파이프라인

**대안 방식 — 클라이언트 사이드 렌더링:**

서버 사이드 변환이 어려운 경우, PDF 원본을 반환하고 클라이언트의 `react-pdf`로 렌더링할 수 있다. 다만 대용량 PDF에서 성능 이슈가 발생할 수 있다.

```
Content-Type: application/pdf
Content-Length: <파일크기>
Cache-Control: public, max-age=3600
```

**인증 미적용에 대한 보안 고려사항:**

미리보기 API는 인증 없이 접근 가능하므로, 파일 ID를 아는 누구나 접근할 수 있다. 이에 대한 보안 대응:
- **파일 ID**: cuid/uuid 사용으로 추측 불가능하게 설정 (순차 증가 ID 사용 금지)
- **서명된 URL**: 만료 시간이 있는 서명된 URL을 생성하여 접근 제어
- **Rate Limiting**: IP 기반 요청 제한으로 무차별 대입 방지
- **공개/비공개 구분**: 비공개 파일이 있는 경우 인증 필수로 변경 검토

핵심 포인트:
- 미리보기 API는 다운로드 카운트를 증가시키지 않음 (다운로드 API와 분리)
- 캐싱 헤더를 설정하여 반복 요청 최소화

### 4.3 파일 다운로드 API

**`GET /api/files/:id`**

| 항목 | 내용 |
|------|------|
| 인증 | 필수 |
| 응답 | 파일 바이너리 (attachment) |

- `Content-Disposition: attachment` 헤더로 강제 다운로드
- 한글 파일명은 `encodeURIComponent`로 인코딩 (`filename*=UTF-8''...`)
- 다운로드 시 카운트 증가

## 5. 프론트엔드 구현

### 5.1 PDF 미리보기 컴포넌트

핵심 라이브러리: **`react-pdf`**

```
npm install react-pdf
```

**번들러 설정 (Next.js):**

`react-pdf`는 PDF.js Worker 파일을 별도로 로드해야 하므로 번들러 설정이 필요하다.

Turbopack (Next.js 15+):
```ts
// next.config.ts
const nextConfig = {
  // Turbopack은 기본적으로 import.meta.url 방식을 지원
  // 별도 설정 불필요
};
```

Webpack (Next.js 14 이하):
```ts
// next.config.ts
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};
```

구현 핵심:

```tsx
// PDF Worker 설정 (필수)
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
```

**Worker 설정 대안:**

`import.meta.url` 방식이 번들러에서 동작하지 않을 경우 대안:

```tsx
// 방법 2: CDN 방식
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// 방법 3: public 디렉토리에 Worker 파일 복사
// public/pdf.worker.min.mjs에 파일을 복사한 후:
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
```

컴포넌트 구조:

```tsx
<Document
  file={`/api/files/${fileId}/preview`}   // 미리보기 API 호출
  loading={<LoadingSpinner />}
  onLoadError={() => setError(true)}       // 에러 시 대체 UI
>
  <Page
    pageNumber={1}                         // 첫 페이지만 렌더링
    width={80}                             // 썸네일 크기
    renderTextLayer={false}                // 텍스트 레이어 비활성화 (성능)
    renderAnnotationLayer={false}          // 주석 레이어 비활성화 (성능)
  />
</Document>
```

주요 설정:
- `pageNumber={1}`: 첫 페이지만 썸네일로 표시
- `renderTextLayer={false}`: 텍스트 선택 불필요하므로 비활성화 (렌더링 성능 향상)
- `renderAnnotationLayer={false}`: 링크/폼 등 주석 불필요하므로 비활성화
- `width={80}`: 썸네일 크기 지정 (원본 비율 자동 유지)

에러 처리:
- PDF 로드 실패 시 아이콘 + "PDF" 텍스트로 대체 UI 표시
- 로딩 중에는 스피너 또는 아이콘 표시

### 5.2 파일 타입 분기 컴포넌트

`FilePreview` 컴포넌트에서 `mimeType`에 따라 미리보기 방식을 분기한다:

```
mimeType 판별
  ├─ image/*           → ImagePreview (img 태그 + 모달 확대)
  ├─ application/pdf   → PdfPreview (react-pdf 기반 첫 페이지 렌더링)
  └─ 기타              → 파일 타입 아이콘 표시 (EXCEL, WORD, ZIP 등)
```

### 5.3 파일 업로드 컴포넌트

기능:
- 드래그 앤 드롭 업로드
- 클릭하여 파일 선택
- XHR 기반 업로드 진행률 표시
- 파일 수/크기 검증
- 업로드된 파일 목록 표시 및 개별 삭제

업로드 방식으로 `XMLHttpRequest`를 사용하는 이유:
- `fetch`도 최신 브라우저에서 `ReadableStream`을 통한 업로드 진행률 트래킹이 가능하나, 브라우저 호환성이 제한적
- XHR의 `upload.onprogress`가 더 널리 호환되므로 안정적인 진행률 표시를 위해 선택

## 6. 의존성 목록

### 백엔드
| 패키지 | 용도 | 비고 |
|--------|------|------|
| `sharp` | 이미지 리사이즈/포맷 변환 | PDF가 아닌 이미지 미리보기용 |
| `uuid` | 파일명 생성 | 충돌 방지용 UUID v4 |

### 프론트엔드
| 패키지 | 용도 | 비고 |
|--------|------|------|
| `react-pdf` | PDF 렌더링 | pdfjs 기반, Worker 설정 필수 |
| `pdfjs-dist` | PDF 파싱 엔진 | react-pdf 의존성으로 자동 설치 |

## 7. 구현 체크리스트

### 백엔드
- [ ] 파일 메타데이터 DB 테이블 생성 (인덱스 포함)
- [ ] 파일 저장 유틸리티 구현 (UUID 파일명, 연월 디렉토리)
- [ ] MIME 타입 화이트리스트 및 Magic bytes 검증 구현
- [ ] `POST /api/upload` — 파일 업로드 API
- [ ] `GET /api/files/:id/preview` — 미리보기 API (서버 사이드 썸네일 생성 권장)
- [ ] `GET /api/files/:id` — 파일 다운로드 API
- [ ] uploads 디렉토리 자동 생성 처리
- [ ] 환경변수 설정 (UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_MIME_TYPES)
- [ ] 파일 삭제 처리 (게시글 삭제 시 연동)

### 프론트엔드
- [ ] `react-pdf` 설치 및 PDF Worker 설정
- [ ] 번들러 설정 (Next.js webpack/turbopack)
- [ ] PdfPreview 컴포넌트 구현 (첫 페이지 썸네일)
- [ ] FilePreview 컴포넌트 구현 (mimeType 분기)
- [ ] FileUpload 컴포넌트 구현 (드래그 앤 드롭, 진행률)
- [ ] 에러 상태 대체 UI 구현

### 테스트
- [ ] 업로드 API 단위 테스트 (성공, 크기 초과, 타입 거부, 수량 초과)
- [ ] MIME 타입 / Magic bytes 검증 테스트
- [ ] 미리보기 API 통합 테스트 (PDF, 이미지, 미지원 타입)
- [ ] 파일 다운로드 API 테스트 (인증, 카운트 증가)
- [ ] 에러 시나리오 테스트 (파일 없음, 디스크 부족, 권한 오류)

### 인프라
- [ ] uploads 디렉토리 `.gitignore`에 추가
- [ ] Docker 사용 시 uploads 볼륨 마운트 설정

## 8. 주의사항

1. **react-pdf Worker 설정 필수**: Worker가 없으면 PDF 렌더링이 동작하지 않음. `import.meta.url` 기반 설정이 기본이며, 동작하지 않으면 CDN 또는 정적 파일 복사 방식 사용.
2. **미리보기와 다운로드 API 분리**: 미리보기는 인증 없이 접근 가능하게, 다운로드는 인증 필수로 분리하여 다운로드 카운트의 정확성을 보장.
3. **파일명 보안**: 원본 파일명을 그대로 저장 경로로 사용하지 않음. UUID 기반 파일명으로 경로 탐색(Path Traversal) 공격 방지.
4. **대용량 PDF 최적화**: 서버에서 첫 페이지를 이미지로 변환하여 반환하는 방식을 기본으로 권장. 클라이언트 사이드 렌더링은 소규모 PDF에만 적합.
5. **캐싱**: 미리보기 응답에 `Cache-Control` 헤더를 설정하여 브라우저 캐싱을 활용.
6. **CORS 설정**: 프론트엔드와 백엔드가 다른 도메인에서 운영되는 경우, 미리보기/다운로드 API에 CORS 헤더 설정이 필수. `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`를 적절히 구성해야 한다.
7. **MIME 타입 검증**: 파일 확장자뿐 아니라 Magic bytes를 검증하여 위장된 악성 파일 업로드를 방지.
