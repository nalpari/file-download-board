"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 게시글 목록 조회 (페이지네이션)
export async function getPosts(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        files: { select: { id: true, mimeType: true } },
      },
    }),
    prisma.post.count(),
  ]);
  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// 게시글 단건 조회
export async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      files: true,
    },
  });
  return post;
}

// 게시글 생성
export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const filesJson = formData.get("files") as string;

  if (!title || !content) return { error: "제목과 내용을 입력해주세요." };

  const fileData = filesJson ? JSON.parse(filesJson) : [];

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId: session.user.id,
      files: {
        create: fileData.map(
          (f: {
            originalName: string;
            storedName: string;
            mimeType: string;
            size: number;
            path: string;
          }) => ({
            originalName: f.originalName,
            storedName: f.storedName,
            mimeType: f.mimeType,
            size: f.size,
            path: f.path,
          })
        ),
      },
    },
  });

  revalidatePath("/");
  redirect(`/posts/${post.id}`);
}

// 게시글 수정
export async function updatePost(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { error: "게시글을 찾을 수 없습니다." };

  const isAdmin = (session.user as { role: string }).role === "ADMIN";
  if (post.authorId !== session.user.id && !isAdmin) {
    return { error: "수정 권한이 없습니다." };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const newFilesJson = formData.get("newFiles") as string;
  const deleteFileIds = formData.getAll("deleteFileIds") as string[];

  // 파일 삭제 처리
  if (deleteFileIds.length > 0) {
    const filesToDelete = await prisma.file.findMany({
      where: { id: { in: deleteFileIds } },
    });
    await Promise.all(
      filesToDelete.map((f: { path: string }) => deleteFile(f.path))
    );
    await prisma.file.deleteMany({ where: { id: { in: deleteFileIds } } });
  }

  // 새 파일 추가
  const newFiles = newFilesJson ? JSON.parse(newFilesJson) : [];

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      files: {
        create: newFiles.map(
          (f: {
            originalName: string;
            storedName: string;
            mimeType: string;
            size: number;
            path: string;
          }) => ({
            originalName: f.originalName,
            storedName: f.storedName,
            mimeType: f.mimeType,
            size: f.size,
            path: f.path,
          })
        ),
      },
    },
  });

  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

// 게시글 삭제
export async function deletePost(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");

  const post = await prisma.post.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!post) return { error: "게시글을 찾을 수 없습니다." };

  const isAdmin = (session.user as { role: string }).role === "ADMIN";
  if (post.authorId !== session.user.id && !isAdmin) {
    return { error: "삭제 권한이 없습니다." };
  }

  // 디스크에서 파일 삭제
  await Promise.all(
    post.files.map((f: { path: string }) => deleteFile(f.path))
  );

  await prisma.post.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}
