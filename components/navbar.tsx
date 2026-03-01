import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = (user as { role?: string })?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gray-900 dark:text-gray-50">
          파일 다운로드 게시판
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  관리자
                </Link>
              )}
              <span className="text-gray-700 dark:text-gray-300">
                {user.name}님
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
