import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

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
