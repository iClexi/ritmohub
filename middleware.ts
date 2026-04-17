import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "musisec_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /academiax (index) is public, anything deeper requires session cookie.
  if (pathname === "/academiax" || pathname === "/academiax/") {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const target = request.nextUrl.clone();
  target.pathname = "/register";
  target.searchParams.set("next", pathname);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/academiax/:path*", "/api/:path*"],
};
