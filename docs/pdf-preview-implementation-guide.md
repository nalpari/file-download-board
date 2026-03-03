# PDF 파일 업로드 및 미리보기 기능 구현 계획서

## 1. 기능 개요

PDF 파일을 업로드하고, 업로드된 PDF의 첫 페이지를 썸네일로 미리보기하는 기능.
본 문서는 `file-download-board` 프로젝트의 구현을 분석하여, 다른 어플리케이션에 동일 기능을 이식할 수 있도록 작성되었다.

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
│  │ FormData     │    │ PDF → 원본 반환            │       │
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

### 3.3 환경 변수

```env
UPLOAD_DIR="./uploads"          # 파일 저장 루트 경로
MAX_FILE_SIZE=10485760          # 최대 파일 크기 (10MB)
MAX_FILES_PER_POST=5            # 게시글당 최대 파일 수
```

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
   - 파일 크기 검증 (기본 10MB)
   - 연월 기반 디렉토리 생성
   - UUID 파일명 생성
   - 디스크에 저장
5. 저장 결과 반환 (originalName, storedName, mimeType, size, path)

응답 예시:
```json
{
  "files": [
    {
      "originalName": "report.pdf",
      "storedName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "mimeType": "application/pdf",
      "size": 2048576,
      "path": "./uploads/2026-03/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf"
    }
  ]
}
```

### 4.2 PDF 미리보기 API

**`GET /api/files/:id/preview`**

| 항목 | 내용 |
|------|------|
| 인증 | 불필요 (미리보기 전용) |
| 응답 | PDF 원본 바이너리 |

처리 흐름:
1. DB에서 파일 메타데이터 조회
2. `mimeType`이 미리보기 지원 타입인지 확인 (이미지, PDF)
3. 파일시스템에 파일 존재 여부 확인
4. **PDF인 경우**: 원본 파일을 그대로 반환
5. **이미지인 경우**: `sharp` 라이브러리로 리사이즈 후 WebP 변환하여 반환

PDF 응답 헤더:
```
Content-Type: application/pdf
Content-Length: <파일크기>
Cache-Control: public, max-age=3600
```

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
- `fetch`는 업로드 진행률(progress) 이벤트를 지원하지 않음
- XHR의 `upload.onprogress`로 실시간 진행률 표시 가능

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
- [ ] 파일 메타데이터 DB 테이블 생성
- [ ] 파일 저장 유틸리티 구현 (UUID 파일명, 연월 디렉토리)
- [ ] `POST /api/upload` — 파일 업로드 API
- [ ] `GET /api/files/:id/preview` — 미리보기 API (PDF 원본 반환)
- [ ] `GET /api/files/:id` — 파일 다운로드 API
- [ ] uploads 디렉토리 자동 생성 처리
- [ ] 환경변수 설정 (UPLOAD_DIR, MAX_FILE_SIZE)

### 프론트엔드
- [ ] `react-pdf` 설치 및 PDF Worker 설정
- [ ] PdfPreview 컴포넌트 구현 (첫 페이지 썸네일)
- [ ] FilePreview 컴포넌트 구현 (mimeType 분기)
- [ ] FileUpload 컴포넌트 구현 (드래그 앤 드롭, 진행률)
- [ ] 에러 상태 대체 UI 구현

### 인프라
- [ ] uploads 디렉토리 `.gitignore`에 추가
- [ ] Docker 사용 시 uploads 볼륨 마운트 설정

## 8. 주의사항

1. **react-pdf Worker 설정 필수**: Worker가 없으면 PDF 렌더링이 동작하지 않음. `import.meta.url` 기반으로 Worker 경로를 설정해야 함.
2. **미리보기와 다운로드 API 분리**: 미리보기는 인증 없이 접근 가능하게, 다운로드는 인증 필수로 분리하여 다운로드 카운트의 정확성을 보장.
3. **파일명 보안**: 원본 파일명을 그대로 저장 경로로 사용하지 않음. UUID 기반 파일명으로 경로 탐색(Path Traversal) 공격 방지.
4. **대용량 PDF**: 매우 큰 PDF 파일의 경우 미리보기 API에서 전체 파일을 반환하므로 네트워크 부하가 발생할 수 있음. 필요 시 서버에서 첫 페이지만 이미지로 변환하여 반환하는 방식으로 최적화 가능.
5. **캐싱**: 미리보기 응답에 `Cache-Control` 헤더를 설정하여 브라우저 캐싱을 활용.
