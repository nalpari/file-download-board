# File Download Board - Design Document

Date: 2026-03-01

## Overview

A file download board web application where users can upload and download files through a bulletin board interface. Supports image preview and PDF preview for attached files.

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Auth | NextAuth.js v5 (Credentials Provider) |
| PDF Preview | react-pdf |
| Image Processing | sharp (thumbnails) |
| File Storage | Local filesystem (`./uploads/`) |
| Deployment | Docker + Docker Compose |

## Architecture

**Approach**: Next.js API Routes + Server Actions (monolithic)

- File uploads handled via Route Handlers (`/api/upload`)
- CRUD operations handled via Server Actions
- Single project manages both frontend and backend

## Data Model

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| email | String | Unique |
| password | String | bcrypt hashed |
| name | String | Display name |
| role | Enum (ADMIN, USER) | Default: USER |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Post
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| title | String | Required |
| content | String | Required |
| authorId | String | FK -> User.id |
| downloadCount | Int | Default: 0 |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### File
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| originalName | String | Original filename |
| storedName | String | UUID-based stored filename |
| mimeType | String | MIME type |
| size | Int | File size in bytes |
| path | String | Local filesystem path |
| postId | String | FK -> Post.id |
| createdAt | DateTime | Auto |

### Relationships
- User 1:N Post
- Post 1:N File (max 5 files per post)

## Page Structure

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login page
│   └── register/page.tsx       # Registration page
├── (main)/
│   ├── layout.tsx              # Main layout (navigation bar)
│   ├── page.tsx                # Post list (main page)
│   └── posts/
│       ├── new/page.tsx        # Create post
│       ├── [id]/
│       │   ├── page.tsx        # Post detail (file preview)
│       │   └── edit/page.tsx   # Edit post
├── admin/
│   ├── page.tsx                # Admin dashboard
│   ├── users/page.tsx          # User management
│   └── posts/page.tsx          # Post management
└── api/
    ├── auth/[...nextauth]/     # NextAuth.js
    ├── upload/route.ts         # File upload API
    ├── files/[id]/
    │   ├── route.ts            # File download API
    │   └── preview/route.ts    # File preview API
    └── posts/                  # Post APIs (supplementary)
```

## Authentication & Authorization

### Auth Flow
- NextAuth.js v5 with Credentials Provider
- Password hashing: bcrypt
- Session: JWT-based

### Permission Matrix

| Action | Guest | USER | ADMIN |
|--------|-------|------|-------|
| View post list | Y | Y | Y |
| View post detail | Y | Y | Y |
| Download file | N | Y | Y |
| Create post | N | Y | Y |
| Edit/Delete own post | N | Y | Y |
| Delete others' posts | N | N | Y |
| User management | N | N | Y |

### Middleware
- `middleware.ts` protects routes
- `/admin/*` requires ADMIN role
- `/posts/new`, `/posts/[id]/edit` require login

## File System

### Upload Flow
1. Client sends multipart/form-data to `POST /api/upload`
2. Server validates file size (max 10MB) and count (max 5 per post)
3. Generates UUID filename, saves to `./uploads/{yyyy-mm}/{uuid}.{ext}`
4. Stores metadata in DB
5. Returns fileId, originalName, mimeType, size

### Download Flow
1. Client requests `GET /api/files/{id}`
2. Server verifies auth and fetches file info from DB
3. Sets `Content-Disposition: attachment` header
4. Streams file response
5. Increments downloadCount

### Preview Strategy

| File Type | Preview Method |
|-----------|---------------|
| Images (jpg, png, gif, webp) | Direct `<img>` rendering via `/api/files/{id}/preview` with resized image |
| PDF | `react-pdf` library renders first page client-side |
| Other documents | File icon + metadata display with download button |

## Docker Deployment

### Docker Compose Services
- **app**: Next.js application (port 3000)
  - Volume: `./uploads:/app/uploads`
  - Environment: DATABASE_URL, NEXTAUTH_SECRET, etc.
- **db**: PostgreSQL 15 (port 5432)
  - Volume: `pgdata:/var/lib/postgresql/data`

### Dockerfile (Multi-stage)
1. **deps**: `npm ci`
2. **builder**: `npx prisma generate && next build`
3. **runner**: Standalone output for minimal image

## Error Handling

- **Upload failures**: Client-side pre-validation + server re-validation. Cleanup saved files on error.
- **Download failures**: 404 for missing files. Log streaming errors.
- **Auth errors**: Auto-redirect for expired tokens. 403 for insufficient permissions.
- **Global errors**: Consistent error pages via `error.tsx` and `not-found.tsx`.

## Constraints

- Max file size: 10MB per file
- Max files per post: 5
- File storage: Local filesystem (Docker volume mount)
- Supported preview: Images (jpg, png, gif, webp), PDF
