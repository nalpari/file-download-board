# 파일 다운로드 게시판

파일을 업로드하고 다운로드할 수 있는 게시판 웹 애플리케이션입니다.

## 기술 스택

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Prisma 7** + PostgreSQL (`@prisma/adapter-pg`)
- **NextAuth v5** (Credentials)
- **React Compiler** (babel-plugin-react-compiler)

## 주요 기능

- 회원가입 / 로그인 (이메일 + 비밀번호)
- 게시글 CRUD (제목, 내용, 첨부 파일)
- 파일 업로드 및 다운로드 (이미지, PDF, 문서 등)
- 이미지/PDF 미리보기
- 관리자 패널 (게시글/사용자 관리)
- 역할 기반 접근 제어 (USER / ADMIN)

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL

### 설치

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에서 DATABASE_URL, NEXTAUTH_SECRET 등 수정

# DB 마이그레이션
npx prisma migrate dev

# (선택) 시드 데이터
npx prisma db seed

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 환경변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | - |
| `NEXTAUTH_URL` | 앱 URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 암호화 키 | - |
| `UPLOAD_DIR` | 파일 저장 경로 | `./uploads` |
| `MAX_FILE_SIZE` | 최대 파일 크기 (bytes) | `10485760` (10MB) |
| `MAX_FILES_PER_POST` | 게시글당 최대 파일 수 | `5` |

## 프로젝트 구조

```
app/
├── (auth)/          # 로그인/회원가입 페이지
├── (main)/          # 메인 레이아웃 (Sidebar + Navbar)
│   ├── page.tsx     # 게시글 목록
│   └── posts/       # 게시글 작성/상세/수정
├── admin/           # 관리자 패널
├── actions/         # Server Actions (auth, posts, admin)
└── api/             # API Routes (auth, upload, files)
components/          # 공용 컴포넌트
lib/                 # 인증, DB, 업로드, 유틸리티
prisma/              # 스키마 및 마이그레이션
types/               # NextAuth 타입 확장
```

## 스크립트

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버
npm run lint      # ESLint
```
