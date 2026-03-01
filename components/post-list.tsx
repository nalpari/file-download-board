"use client";

import Link from "next/link";
import {
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
  Download,
} from "lucide-react";

interface PostListProps {
  posts: {
    id: string;
    title: string;
    author: { name: string | null };
    files: { id: string; mimeType: string }[];
    downloadCount: number;
    createdAt: Date;
  }[];
}

function getFileTypeBadge(mimeType: string) {
  if (mimeType.startsWith("image/")) return { label: "IMAGE", className: "badge-image", icon: ImageIcon };
  if (mimeType === "application/pdf") return { label: "PDF", className: "badge-pdf", icon: FileText };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return { label: "EXCEL", className: "badge-excel", icon: FileSpreadsheet };
  if (mimeType.includes("word") || mimeType.includes("document")) return { label: "WORD", className: "badge-word", icon: FileText };
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed")) return { label: "ZIP", className: "badge-zip", icon: FileArchive };
  return { label: "FILE", className: "badge-default", icon: File };
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="table-container py-16 text-center">
        <p style={{ color: "var(--text-muted)" }}>게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="table-container overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
            <th className="px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>제목</th>
            <th className="px-5 py-3 text-xs font-medium text-center w-24" style={{ color: "var(--text-muted)" }}>파일유형</th>
            <th className="px-5 py-3 text-xs font-medium text-center w-24" style={{ color: "var(--text-muted)" }}>작성자</th>
            <th className="px-5 py-3 text-xs font-medium text-center w-28" style={{ color: "var(--text-muted)" }}>작성일</th>
            <th className="px-5 py-3 text-xs font-medium text-center w-16" style={{ color: "var(--text-muted)" }}></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const primaryFile = post.files[0];
            const badge = primaryFile ? getFileTypeBadge(primaryFile.mimeType) : null;

            return (
              <tr
                key={post.id}
                className="transition-base"
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {badge && <badge.icon size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                    <Link
                      href={`/posts/${post.id}`}
                      className="font-medium transition-base"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    >
                      {post.title}
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {badge && (
                    <span className={`badge ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  {post.author.name ?? "알 수 없음"}
                </td>
                <td className="px-5 py-3.5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Link href={`/posts/${post.id}`} className="transition-base" style={{ color: "var(--text-muted)" }}>
                    <Download size={16} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
