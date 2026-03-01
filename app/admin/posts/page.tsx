import { getAdminPosts } from "@/app/actions/admin";
import { AdminDeletePostButton } from "@/components/admin-post-actions";
import Link from "next/link";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const { posts, total } = await getAdminPosts(currentPage);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          게시글 관리
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          총 {total}개
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                제목
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                작성자
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                파일
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                다운로드
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                작성일
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map((post: { id: string; title: string; downloadCount: number; createdAt: Date; author: { name: string | null; email: string }; _count: { files: number } }) => (
              <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="max-w-xs px-4 py-3">
                  <Link
                    href={`/posts/${post.id}`}
                    className="truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {post.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {post.author.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {post._count.files}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {post.downloadCount}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatDate(post.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <AdminDeletePostButton postId={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
