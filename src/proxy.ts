import { NextResponse, type NextRequest } from "next/server";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const SENSITIVE_QUERY_PARAMS = ["email", "password"];

function isLocalHost(hostname: string) {
  return LOCAL_HOSTNAMES.has(hostname);
}

function getRequestHostname(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;

  if (host.startsWith("[")) {
    return host.slice(1, host.indexOf("]"));
  }

  return host.split(":")[0] ?? request.nextUrl.hostname;
}

function getRequestProtocol(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto || request.nextUrl.protocol.replace(":", "");
}

function shouldForceHttps(request: NextRequest) {
  const hostname = getRequestHostname(request);

  return (
    process.env.NODE_ENV === "production" &&
    !isLocalHost(hostname) &&
    getRequestProtocol(request) === "http"
  );
}

function stripSensitiveLoginParams(request: NextRequest) {
  if (request.nextUrl.pathname !== "/login") {
    return null;
  }

  const target = request.nextUrl.clone();
  let changed = false;

  for (const key of SENSITIVE_QUERY_PARAMS) {
    if (target.searchParams.has(key)) {
      target.searchParams.delete(key);
      changed = true;
    }
  }

  return changed ? NextResponse.redirect(target, 303) : null;
}

export function proxy(request: NextRequest) {
  if (shouldForceHttps(request)) {
    const target = request.nextUrl.clone();
    const host = request.headers.get("host");
    target.protocol = "https:";
    if (host) {
      target.host = host;
    }
    return NextResponse.redirect(target, 308);
  }

  const sanitizedLoginRedirect = stripSensitiveLoginParams(request);
  if (sanitizedLoginRedirect) {
    return sanitizedLoginRedirect;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
