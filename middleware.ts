import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "musisec_session";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const expectedOrigin = request.nextUrl.origin;

  if (origin) {
    return origin === expectedOrigin;
  }

  if (referer) {
    return referer.startsWith(expectedOrigin);
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") && unsafeMethods.has(request.method)) {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ message: "Origen no autorizado." }, { status: 403 });
    }
  }

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
