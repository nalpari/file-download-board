# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**file-download-board** — 파일 업로드/다운로드 기능이 있는 게시판 웹 애플리케이션. 사용자 인증, 게시글 CRUD, 파일 첨부, 관리자 기능을 포함한다.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **ORM**: Prisma 7 with `@prisma/adapter-pg` (PostgreSQL)
- **Auth**: NextAuth v5 (beta) with Credentials provider
- **Font**: Space Grotesk (Google Fonts)
- **Icons**: lucide-react
- **Build**: `output: "standalone"` (Docker-ready)
- **React Compiler**: babel-plugin-react-compiler enabled
- **Skills**: `next-best-practices`, `vercel-react-best-practices`

## Commands

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 실행 (eslint-config-next/core-web-vitals + typescript)
npx tsc --noEmit  # 타입 체크
npx prisma generate          # Prisma 클라이언트 생성 (output: generated/prisma)
npx prisma migrate dev       # 마이그레이션 실행
npx prisma db seed           # 시드 데이터 (npx tsx prisma/seed.ts)
```

## Architecture

### Route Groups & Layouts

```
app/
├── layout.tsx              # 루트 레이아웃 (Space Grotesk 폰트, lang="ko")
├── (auth)/                 # 인증 페이지 그룹 (별도 레이아웃)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/                 # 메인 레이아웃 (Sidebar + Navbar)
│   ├── page.tsx            # 게시글 목록 (홈)
│   └── posts/
│       ├── new/page.tsx    # 게시글 작성
│       └── [id]/           # 게시글 상세/수정
├── admin/                  # 관리자 패널 (ADMIN 역할 전용)
└── api/
    ├── auth/[...nextauth]/ # NextAuth 핸들러
    ├── upload/             # 파일 업로드 API
    └── files/[id]/         # 파일 다운로드 및 프리뷰 API
```

### 핵심 패턴

- **Server Actions**: `app/actions/` — auth, posts, admin 관련 서버 액션. `"use server"` 디렉티브 사용
- **Prisma Client**: `lib/prisma.ts` — PrismaPg 어댑터를 사용하여 PostgreSQL 연결. generated output은 `generated/prisma/`에 위치
- **Auth 분리**: `lib/auth.config.ts` (middleware용, provider 없음) + `lib/auth.ts` (full config with Credentials)로 분리하여 Edge Runtime 호환
- **Middleware**: `middleware.ts` — NextAuth 기반 라우트 보호. `/posts/new`, `/posts/edit`은 로그인 필요, `/admin`은 ADMIN 역할 필요
- **File Upload**: `lib/upload.ts` — UUID 기반 파일 이름 생성, `uploads/YYYY-MM/` 디렉토리 구조로 저장
- **Utils**: `lib/utils.ts` — 파일 크기 포맷, 날짜 포맷, MIME 타입 분류, 관리자 확인 등 공통 유틸리티

### DB Schema (Prisma)

- **User**: id, email, password(bcrypt), name, role(USER/ADMIN)
- **Post**: id, title, content, downloadCount, authorId → User
- **File**: id, originalName, storedName, mimeType, size, path, postId → Post
- 테이블명은 `@@map`으로 snake_case 매핑 (users, posts, files)

### Auth Flow

NextAuth v5 Credentials 방식. JWT 콜백에서 `id`, `role`을 토큰에 저장하고, session 콜백에서 사용자 객체에 주입. `types/next-auth.d.ts`에서 Session 타입 확장.

### 환경변수

`.env.example` 참고: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `MAX_FILES_PER_POST`

### Path Alias

`@/*` → 프로젝트 루트 (`tsconfig.json`)

## Memo

- 모든 답변과 추론과정은 한국어로 작성한다.
- 항상 CLAUDE.md 파일을 먼저 확인하고, 그 내용을 바탕으로 답변하며, 필요한경우 항상 최신화로 업데이트 상태를 유지한다.
- 코드 생성시, 항상 CLAUDE.md의 내용을 참고하여 생성한다.
- 코드 생성시, 항상 최신화된 코드를 생성한다.
- 코드 작업을 마치면 항상 린트체크, 타입체크, 빌드체크를 수행한다.
- 커밋메시지 작성시에는 접두사를 제외한 메세지 본문은 한국어로 작성한다.
- 린트 체크는 경고도 무시하지말고 해결하려고 최대한 시도한다.
