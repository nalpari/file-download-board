import { getPost } from "@/app/actions/posts";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { FilePreview } from "@/components/file-preview";
import { DeletePostButton } from "@/components/delete-post-button";
import Link from "next/link";
import type { File as PrismaFile } from "@/generated/prisma/client";
import { ArrowLeft, Edit, Calendar, User, Download } from "lucide-react";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileBadge(mimeType: string) {
  if (mimeType.startsWith("image/")) return { label: "IMAGE", className: "badge-image" };
  if (mimeType === "application/pdf") return { label: "PDF", className: "badge-pdf" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return { label: "EXCEL", className: "badge-excel" };
  if (mimeType.includes("word") || mimeType.includes("document")) return { label: "WORD", className: "badge-word" };
  if (mimeType.includes("zip") || mimeType.includes("archive")) return { label: "ZIP", className: "badge-zip" };
  return { label: "FILE", className: "badge-default" };
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
  const primaryBadge = post.files[0] ? getFileBadge(post.files[0].mimeType) : null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm transition-base"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={16} />
        게시판으로 돌아가기
      </Link>

      {/* Card */}
      <article
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                >
                  {post.title}
                </h1>
                {primaryBadge && (
                  <span className={`badge ${primaryBadge.className}`}>{primaryBadge.label}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  {post.author.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formatDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Download size={14} />
                  {post.downloadCount}회
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-base"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  <Edit size={14} />
                  수정
                </Link>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {post.content}
          </div>
        </div>

        {/* Files */}
        {post.files.length > 0 && (
          <div className="p-6" style={{ borderTop: "1px solid var(--border)" }}>
            <h2
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              첨부파일 ({post.files.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {post.files.map((file: PrismaFile) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
