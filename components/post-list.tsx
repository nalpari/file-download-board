import Link from "next/link";

interface PostListProps {
  posts: {
    id: string;
    title: string;
    author: { name: string | null };
    files: { id: string }[];
    downloadCount: number;
    createdAt: Date;
  }[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 text-center w-16">#</th>
            <th className="px-4 py-3">제목</th>
            <th className="px-4 py-3 text-center w-24">작성자</th>
            <th className="px-4 py-3 text-center w-20">파일</th>
            <th className="px-4 py-3 text-center w-24">다운로드</th>
            <th className="px-4 py-3 text-center w-28">작성일</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {posts.map((post, index) => (
            <tr
              key={post.id}
              className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                {index + 1}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                >
                  {post.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                {post.author.name ?? "알 수 없음"}
              </td>
              <td className="px-4 py-3 text-center">
                {post.files.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {post.files.length}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                {post.downloadCount}
              </td>
              <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("ko-KR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
