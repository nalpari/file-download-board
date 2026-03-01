import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { Search, Shield } from "lucide-react";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = (user as { role?: string })?.role === "ADMIN";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-[var(--header-height)] items-center justify-between bg-white px-6"
      style={{
        left: "var(--sidebar-width)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          placeholder="파일 검색..."
          className="w-full rounded-lg py-2 pl-9 pr-4 text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* User area */}
      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-base"
                style={{ color: "var(--accent-primary)" }}
              >
                <Shield size={14} />
                관리자
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm transition-base"
                style={{ color: "var(--text-secondary)" }}
              >
                로그아웃
              </button>
            </form>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}
              title={user.name ?? ""}
            >
              {initials || "U"}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm transition-base"
              style={{ color: "var(--text-secondary)" }}
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-base"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
