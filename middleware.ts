import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "musisec_session";

function isPublicApiPath(pathname: string) {
  return pathname.startsWith("/api/auth/");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") && isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // /academiax (index) is public, anything deeper requires session cookie.
  if (pathname === "/academiax" || pathname === "/academiax/") {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const target = request.nextUrl.clone();
  target.pathname = "/register";
  target.searchParams.set("next", pathname);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/academiax/:path*", "/api/:path*"],
};
