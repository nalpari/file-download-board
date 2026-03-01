import Link from "next/link";
import { Navbar } from "@/components/navbar";

const adminLinks = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/posts", label: "게시글 관리" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <aside className="w-56 flex-shrink-0">
          <nav className="sticky top-8 space-y-1 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              관리자
            </p>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
