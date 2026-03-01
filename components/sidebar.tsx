"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive, LayoutGrid, Upload, FolderOpen, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "게시판", icon: LayoutGrid },
  { href: "/posts/new", label: "파일 업로드", icon: Upload },
  { href: "/my-files", label: "내 파일", icon: FolderOpen },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-white"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex h-[var(--header-height)] items-center gap-2.5 px-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <HardDrive size={22} style={{ color: "var(--accent-primary)" }} />
        <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          FileBoard
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-base"
                  style={{
                    backgroundColor: isActive ? "var(--accent-light)" : "transparent",
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
