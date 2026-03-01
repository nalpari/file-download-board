import { getPosts } from "@/app/actions/posts";
import { auth } from "@/lib/auth";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const { posts, totalPages } = await getPosts(currentPage);
  const session = await auth();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            파일 게시판
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            파일을 업로드하고 공유하세요
          </p>
        </div>
        {session?.user && (
          <Link
            href="/posts/new"
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-base"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Plus size={16} />
            새 파일 업로드
          </Link>
        )}
      </div>

      {/* Table */}
      <PostList posts={posts} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
