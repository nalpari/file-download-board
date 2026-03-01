import { getUsers } from "@/app/actions/admin";
import {
  UserRoleButton,
  DeleteUserButton,
} from "@/components/admin-user-actions";
import type { Role } from "@/generated/prisma/enums";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const { users, total } = await getUsers(currentPage);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          사용자 관리
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          총 {total}명
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                이름
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                이메일
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                역할
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                게시글
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                가입일
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user: { id: string; name: string; email: string; role: Role; createdAt: Date; _count: { posts: number } }) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <UserRoleButton userId={user.id} currentRole={user.role} />
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {user._count.posts}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <DeleteUserButton userId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
