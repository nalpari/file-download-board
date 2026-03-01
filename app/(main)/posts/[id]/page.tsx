import { getPost } from "@/app/actions/posts";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { FilePreview } from "@/components/file-preview";
import { DeletePostButton } from "@/components/delete-post-button";
import Link from "next/link";
import type { File as PrismaFile } from "@/app/generated/prisma/client";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === post.authorId;
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const canEdit = isOwner || isAdmin;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; 목록으로
        </Link>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <header className="mb-6">
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-50">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{post.author.name}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>다운로드 {post.downloadCount}회</span>
          </div>
        </header>

        <div className="mb-8 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {post.content}
        </div>

        {post.files.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              첨부파일 ({post.files.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {post.files.map((file: PrismaFile) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </div>
          </section>
        )}

        {canEdit && (
          <footer className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Link
              href={`/posts/${post.id}/edit`}
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              수정
            </Link>
            <DeletePostButton postId={post.id} />
          </footer>
        )}
      </article>
    </div>
  );
}
