# File Download Board Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a file download board where users can upload/download files with image and PDF preview support.

**Architecture:** Next.js 15 App Router monolith with Server Actions for CRUD and Route Handlers for file operations. PostgreSQL via Prisma ORM. NextAuth.js v5 for email/password authentication. Local filesystem for file storage.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, PostgreSQL 15, Prisma, NextAuth.js v5, react-pdf, sharp, Docker Compose

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.local`, `.env.example`, `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /mnt/c/dev/file-download-board
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

Expected: Next.js project scaffolded with App Router, TypeScript, Tailwind CSS

**Step 2: Create environment files**

Create `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/file_download_board?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
MAX_FILES_PER_POST=5
```

Create `.env.example` with same keys but placeholder values.

**Step 3: Update .gitignore**

Append to `.gitignore`:
```
# Uploads
/uploads/

# Environment
.env.local
```

**Step 4: Configure next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "bcrypt"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
```

**Step 5: Verify project runs**

Run: `npm run dev`
Expected: App starts on http://localhost:3000

**Step 6: Initialize git and commit**

Run:
```bash
git init
git add -A
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind CSS"
```

---

## Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
npm install prisma @prisma/client next-auth@beta bcrypt uuid sharp react-pdf
npm install -D @types/bcrypt @types/uuid
```

**Step 2: Verify installation**

Run: `npm ls prisma next-auth bcrypt uuid sharp react-pdf`
Expected: All packages listed without errors

**Step 3: Commit**

Run:
```bash
git add package.json package-lock.json
git commit -m "feat: install core dependencies (Prisma, NextAuth, bcrypt, sharp, react-pdf)"
```

---

## Task 3: Prisma Schema & Database Setup

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: Initialize Prisma**

Run: `npx prisma init`
Expected: `prisma/schema.prisma` created

**Step 2: Write Prisma schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]

  @@map("users")
}

model Post {
  id            String   @id @default(cuid())
  title         String
  content       String
  downloadCount Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  authorId      String
  author        User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  files         File[]

  @@index([authorId])
  @@index([createdAt])
  @@map("posts")
}

model File {
  id           String   @id @default(cuid())
  originalName String
  storedName   String
  mimeType     String
  size         Int
  path         String
  createdAt    DateTime @default(now())
  postId       String
  post         Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@map("files")
}
```

**Step 3: Create Prisma client utility**

Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 4: Generate Prisma client**

Run: `npx prisma generate`
Expected: Prisma Client generated successfully

**Step 5: Commit**

Run:
```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: add Prisma schema with User, Post, File models"
```

---

## Task 4: Authentication Setup (NextAuth.js v5)

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

**Step 1: Create auth configuration**

Create `lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

**Step 2: Create auth types**

Create `types/next-auth.d.ts`:
```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
}
```

**Step 3: Create auth route handler**

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Step 4: Create middleware**

Create `middleware.ts`:
```typescript
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  // Protected routes requiring login
  const authRequired = ["/posts/new", "/posts/edit"];
  const isAuthRequired = authRequired.some((path) =>
    pathname.startsWith(path)
  );

  if (isAuthRequired && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && !isAdmin) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 5: Commit**

Run:
```bash
git add lib/auth.ts types/next-auth.d.ts app/api/auth/ middleware.ts
git commit -m "feat: add NextAuth.js v5 authentication with Credentials provider"
```

---

## Task 5: Auth Pages (Login & Register)

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/layout.tsx`
- Create: `app/actions/auth.ts`

**Step 1: Create auth layout**

Create `app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

**Step 2: Create register server action**

Create `app/actions/auth.ts`:
```typescript
"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  redirect("/login");
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if ((error as Error).message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Invalid email or password" };
  }
}
```

**Step 3: Create login page**

Create `app/(auth)/login/page.tsx` — a client component with email/password form that calls `login` server action.

**Step 4: Create register page**

Create `app/(auth)/register/page.tsx` — a client component with name/email/password form that calls `register` server action.

**Step 5: Commit**

Run:
```bash
git add app/(auth)/ app/actions/auth.ts
git commit -m "feat: add login and register pages with server actions"
```

---

## Task 6: Main Layout & Navigation

**Files:**
- Create: `app/(main)/layout.tsx`, `components/navbar.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create Navbar component**

Create `components/navbar.tsx`:
- Display site title "File Download Board"
- Show login/register links when not authenticated
- Show username + logout when authenticated
- Show admin link for ADMIN role
- Use `auth()` session for server-side rendering

**Step 2: Create main layout**

Create `app/(main)/layout.tsx`:
- Include Navbar
- Wrap children in a container with padding

**Step 3: Update root layout**

Modify `app/layout.tsx`:
- Set metadata title/description
- Configure Korean language (`lang="ko"`)

**Step 4: Commit**

Run:
```bash
git add app/(main)/layout.tsx components/navbar.tsx app/layout.tsx
git commit -m "feat: add main layout with navigation bar"
```

---

## Task 7: File Upload API

**Files:**
- Create: `app/api/upload/route.ts`, `lib/upload.ts`

**Step 1: Create upload utility**

Create `lib/upload.ts`:
```typescript
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

export function getUploadDir(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return path.join(UPLOAD_DIR, yearMonth);
}

export function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
}

export async function saveFile(
  file: File
): Promise<{ storedName: string; path: string; size: number; mimeType: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE} bytes`);
  }

  const dir = getUploadDir();
  await fs.mkdir(dir, { recursive: true });

  const storedName = generateStoredName(file.name);
  const filePath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    storedName,
    path: filePath,
    size: file.size,
    mimeType: file.type,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist, ignore
  }
}
```

**Step 2: Create upload route handler**

Create `app/api/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  const maxFiles = Number(process.env.MAX_FILES_PER_POST) || 5;
  if (files.length > maxFiles) {
    return NextResponse.json(
      { error: `Maximum ${maxFiles} files allowed` },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const saved = await saveFile(file);
        return {
          originalName: file.name,
          ...saved,
        };
      })
    );

    return NextResponse.json({ files: results });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
```

**Step 3: Commit**

Run:
```bash
git add lib/upload.ts app/api/upload/route.ts
git commit -m "feat: add file upload API with local filesystem storage"
```

---

## Task 8: Post CRUD Server Actions

**Files:**
- Create: `app/actions/posts.ts`

**Step 1: Create post server actions**

Create `app/actions/posts.ts` with:
- `createPost(formData)` — Create post with file metadata in DB
- `updatePost(id, formData)` — Update post, handle file additions/removals
- `deletePost(id)` — Delete post and associated files from disk
- `getPosts(page, limit)` — Paginated post list
- `getPost(id)` — Single post with files and author

Each action validates auth, checks ownership/admin for mutations.

**Step 2: Commit**

Run:
```bash
git add app/actions/posts.ts
git commit -m "feat: add post CRUD server actions"
```

---

## Task 9: Post List Page (Main Page)

**Files:**
- Create: `app/(main)/page.tsx`, `components/post-list.tsx`, `components/pagination.tsx`

**Step 1: Create PostList component**

Create `components/post-list.tsx`:
- Table layout: #, Title, Author, Files count, Download count, Date
- Clickable title linking to `/posts/{id}`
- File count badge
- Server Component

**Step 2: Create Pagination component**

Create `components/pagination.tsx`:
- Client component with page navigation
- Uses `useSearchParams` for page state

**Step 3: Create main page**

Create `app/(main)/page.tsx`:
- Server Component fetching posts with pagination
- Search params for page number
- "New Post" button (visible when logged in)

**Step 4: Commit**

Run:
```bash
git add app/(main)/page.tsx components/post-list.tsx components/pagination.tsx
git commit -m "feat: add post list page with pagination"
```

---

## Task 10: Post Create Page

**Files:**
- Create: `app/(main)/posts/new/page.tsx`, `components/post-form.tsx`, `components/file-upload.tsx`

**Step 1: Create FileUpload component**

Create `components/file-upload.tsx`:
- Client component with drag & drop zone
- File type/size validation on client
- Upload progress indicator
- Max 5 files display with remove button
- Calls `/api/upload` on file selection

**Step 2: Create PostForm component**

Create `components/post-form.tsx`:
- Client component with title, content (textarea), file upload
- Submits via `createPost` server action
- Loading state during submission

**Step 3: Create new post page**

Create `app/(main)/posts/new/page.tsx`:
- Renders PostForm

**Step 4: Commit**

Run:
```bash
git add app/(main)/posts/new/ components/post-form.tsx components/file-upload.tsx
git commit -m "feat: add post creation page with file upload"
```

---

## Task 11: File Download & Preview APIs

**Files:**
- Create: `app/api/files/[id]/route.ts`, `app/api/files/[id]/preview/route.ts`

**Step 1: Create file download route**

Create `app/api/files/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.file.findUnique({
    where: { id },
    include: { post: true },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const filePath = path.resolve(file.path);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  // Increment download count
  await prisma.post.update({
    where: { id: file.postId },
    data: { downloadCount: { increment: 1 } },
  });

  const stream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "Content-Length": String(file.size),
    },
  });
}
```

**Step 2: Create file preview route**

Create `app/api/files/[id]/preview/route.ts`:
- For images: use `sharp` to resize to max 800px width, return as webp
- For other files: return 404 (PDF preview handled client-side)

**Step 3: Commit**

Run:
```bash
git add app/api/files/
git commit -m "feat: add file download and preview APIs"
```

---

## Task 12: Post Detail Page with File Preview

**Files:**
- Create: `app/(main)/posts/[id]/page.tsx`, `components/file-preview.tsx`, `components/pdf-preview.tsx`, `components/image-preview.tsx`

**Step 1: Create ImagePreview component**

Create `components/image-preview.tsx`:
- Server Component using Next.js `<Image>` with preview API
- Lightbox on click (optional enhancement)

**Step 2: Create PdfPreview component**

Create `components/pdf-preview.tsx`:
- Client component (`'use client'`)
- Uses `react-pdf` with `Document` and `Page` components
- Shows first page thumbnail
- Loading/error states

**Step 3: Create FilePreview component**

Create `components/file-preview.tsx`:
- Routes to ImagePreview or PdfPreview based on mimeType
- Falls back to file icon + metadata for unsupported types
- Download button for all file types

**Step 4: Create post detail page**

Create `app/(main)/posts/[id]/page.tsx`:
- Server Component fetching post with files
- Post title, content, author info, date
- File preview grid
- Edit/Delete buttons (visible for author or admin)
- Download all files button

**Step 5: Commit**

Run:
```bash
git add app/(main)/posts/[id]/ components/file-preview.tsx components/pdf-preview.tsx components/image-preview.tsx
git commit -m "feat: add post detail page with image and PDF preview"
```

---

## Task 13: Post Edit Page

**Files:**
- Create: `app/(main)/posts/[id]/edit/page.tsx`

**Step 1: Create edit page**

Create `app/(main)/posts/[id]/edit/page.tsx`:
- Reuses PostForm component with pre-filled data
- Shows existing files with remove option
- Allows adding new files (up to 5 total)
- Validates ownership or admin role server-side

**Step 2: Commit**

Run:
```bash
git add app/(main)/posts/[id]/edit/
git commit -m "feat: add post edit page"
```

---

## Task 14: Admin Pages

**Files:**
- Create: `app/admin/page.tsx`, `app/admin/layout.tsx`, `app/admin/users/page.tsx`, `app/admin/posts/page.tsx`
- Create: `app/actions/admin.ts`

**Step 1: Create admin server actions**

Create `app/actions/admin.ts`:
- `getUsers(page, limit)` — Paginated user list
- `updateUserRole(userId, role)` — Change user role
- `deleteUser(userId)` — Delete user and all their posts
- `adminDeletePost(postId)` — Admin delete any post

**Step 2: Create admin layout**

Create `app/admin/layout.tsx`:
- Sidebar navigation (Dashboard, Users, Posts)
- Admin-specific styling

**Step 3: Create admin dashboard**

Create `app/admin/page.tsx`:
- Stats overview: total users, total posts, total files, total downloads

**Step 4: Create user management page**

Create `app/admin/users/page.tsx`:
- User table with role toggle (USER/ADMIN)
- Delete user button with confirmation

**Step 5: Create post management page**

Create `app/admin/posts/page.tsx`:
- All posts table with delete button
- Filter by user

**Step 6: Commit**

Run:
```bash
git add app/admin/ app/actions/admin.ts
git commit -m "feat: add admin dashboard with user and post management"
```

---

## Task 15: Docker Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

**Step 1: Create .dockerignore**

Create `.dockerignore`:
```
node_modules
.next
.git
uploads
*.md
```

**Step 2: Create Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

**Step 3: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: file_download_board
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/file_download_board?schema=public
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: change-me-in-production
      UPLOAD_DIR: /app/uploads
      MAX_FILE_SIZE: "10485760"
      MAX_FILES_PER_POST: "5"
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db

volumes:
  pgdata:
```

**Step 4: Commit**

Run:
```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat: add Docker and Docker Compose configuration"
```

---

## Task 16: Seed Script & Admin User

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

**Step 1: Create seed script**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed completed: admin@example.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Add seed config to package.json**

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx: `npm install -D tsx`

**Step 3: Commit**

Run:
```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add database seed script with admin user"
```

---

## Task 17: Final Polish & Testing

**Files:**
- Modify: various

**Step 1: Create initial migration**

Run (requires running PostgreSQL):
```bash
npx prisma migrate dev --name init
```

**Step 2: Run seed**

Run: `npx prisma db seed`
Expected: "Seed completed: admin@example.com / admin123"

**Step 3: Run full app test**

Run: `npm run dev`
Manual verification checklist:
- [ ] Register new user at `/register`
- [ ] Login at `/login`
- [ ] Create post with files at `/posts/new`
- [ ] View post with image preview
- [ ] View post with PDF preview
- [ ] Download file
- [ ] Edit post
- [ ] Delete post
- [ ] Admin login (admin@example.com / admin123)
- [ ] Admin user management at `/admin/users`
- [ ] Admin post management at `/admin/posts`

**Step 4: Final commit**

Run:
```bash
git add -A
git commit -m "feat: complete file download board v1.0"
```

---

## Summary

| Task | Description | Est. Steps |
|------|-------------|-----------|
| 1 | Project initialization | 6 |
| 2 | Install dependencies | 3 |
| 3 | Prisma schema & DB setup | 5 |
| 4 | Authentication setup | 5 |
| 5 | Auth pages (login/register) | 5 |
| 6 | Main layout & navigation | 4 |
| 7 | File upload API | 3 |
| 8 | Post CRUD server actions | 2 |
| 9 | Post list page | 4 |
| 10 | Post create page | 4 |
| 11 | File download & preview APIs | 3 |
| 12 | Post detail with preview | 5 |
| 13 | Post edit page | 2 |
| 14 | Admin pages | 6 |
| 15 | Docker setup | 4 |
| 16 | Seed script | 3 |
| 17 | Final polish & testing | 4 |
| **Total** | | **68 steps** |
