import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = (req.auth?.user as { role?: string })?.role === "ADMIN";

  const authRequired = ["/posts/new", "/posts/edit"];
  const isAuthRequired = authRequired.some((path) =>
    pathname.startsWith(path)
  );

  if (isAuthRequired && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
