import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLE_PAGE_ACCESS, ROLE_DEFAULT_PAGE, VIEW_AS_COOKIE, ALL_ROLES, type UserRole } from "@/lib/auth-types";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname === "/icon.svg") {
    return NextResponse.next();
  }

  const session = req.auth;
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const realRole = ((session.user as { role?: string }).role ?? "PRODUCT_MANAGER") as UserRole;

  let role = realRole;
  if (realRole === "ADMIN") {
    const viewAs = req.cookies.get(VIEW_AS_COOKIE)?.value as UserRole | undefined;
    if (viewAs && ALL_ROLES.includes(viewAs)) {
      role = viewAs;
    }
  }

  const domainPageMatch = pathname.match(/^\/domain\/[^/]+\/(.+?)(?:\/|$)/);
  if (domainPageMatch) {
    const page = domainPageMatch[1];
    const allowed = ROLE_PAGE_ACCESS[role] ?? [];
    if (!allowed.includes(page)) {
      const defaultPage = ROLE_DEFAULT_PAGE[role] ?? "dashboard";
      const basePath = pathname.split("/").slice(0, 3).join("/");
      return NextResponse.redirect(new URL(`${basePath}/${defaultPage}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
