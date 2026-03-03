"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminUser(session.user)) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

export async function getAdminStats() {
  await requireAdmin();
  const [userCount, postCount, fileCount, downloadSum] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.file.count(),
    prisma.post.aggregate({ _sum: { downloadCount: true } }),
  ]);
  return {
    userCount,
    postCount,
    fileCount,
    totalDownloads: downloadSum._sum.downloadCount || 0,
  };
}

export async function getUsers(page: number = 1, limit: number = 20) {
  await requireAdmin();
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.user.count(),
  ]);
  return { users, total, totalPages: Math.ceil(total / limit) };
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { posts: { select: { files: { select: { path: true } } } } },
  });
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const allFilePaths = user.posts.flatMap((post) =>
    post.files.map((file) => file.path)
  );
  await Promise.all(allFilePaths.map(deleteFile));
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function getAdminPosts(page: number = 1, limit: number = 20) {
  await requireAdmin();
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
        _count: { select: { files: true } },
      },
    }),
    prisma.post.count(),
  ]);
  return { posts, total, totalPages: Math.ceil(total / limit) };
}

export async function adminDeletePost(postId: string) {
  await requireAdmin();
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { files: { select: { path: true } } },
  });
  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  await Promise.all(post.files.map((file) => deleteFile(file.path)));
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin/posts");
}
