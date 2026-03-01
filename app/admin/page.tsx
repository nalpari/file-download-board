import { getAdminStats } from "@/app/actions/admin";

const statCards = [
  { key: "userCount" as const, label: "총 사용자", icon: "👤" },
  { key: "postCount" as const, label: "총 게시글", icon: "📝" },
  { key: "fileCount" as const, label: "총 파일", icon: "📎" },
  { key: "totalDownloads" as const, label: "총 다운로드", icon: "⬇️" },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-50">
        대시보드
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-2 text-2xl">{card.icon}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-50">
              {stats[card.key].toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
