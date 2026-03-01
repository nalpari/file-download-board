import { getPosts } from "@/app/actions/posts";
import { auth } from "@/lib/auth";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import Link from "next/link";

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          게시글 목록
        </h1>
        {session?.user && (
          <Link
            href="/posts/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            새 게시글
          </Link>
        )}
      </div>
      <PostList posts={posts} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
