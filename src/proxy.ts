import { NextResponse, type NextRequest } from "next/server";

import { createContentSecurityPolicy } from "@/lib/security/csp";
import { requestContentLengthExceeds } from "@/lib/security/request-limits";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const SAFE_LOGIN_QUERY_PARAMS = new Set(["oauthError"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEFAULT_API_BODY_LIMIT = 1024 * 1024;
const PUBLIC_MEDIA_EXTENSION =
  /\.(?:avif|gif|ico|jpe?g|mp3|mp4|ogg|png|svg|wav|webm|webp|woff2?|ttf)$/i;

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

function getConfiguredOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    return null;
  }

  try {
    const url = new URL(configured);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

function shouldForceHttps(request: NextRequest) {
  const hostname = getRequestHostname(request);

  return (
    process.env.NODE_ENV === "production" &&
    !PUBLIC_MEDIA_EXTENSION.test(request.nextUrl.pathname) &&
    !isLocalHost(hostname) &&
    getRequestProtocol(request) === "http"
  );
}

function createCanonicalTarget(request: NextRequest) {
  const configuredOrigin = getConfiguredOrigin();
  if (!configuredOrigin) {
    return null;
  }

  const target = new URL(request.nextUrl.pathname, configuredOrigin);
  target.search = request.nextUrl.search;
  return target;
}

function stripSensitiveLoginParams(request: NextRequest) {
  if (request.nextUrl.pathname !== "/login") {
    return null;
  }

  const target = createCanonicalTarget(request) ?? request.nextUrl.clone();
  let changed = false;

  for (const key of [...target.searchParams.keys()]) {
    if (SAFE_LOGIN_QUERY_PARAMS.has(key)) continue;

    target.searchParams.delete(key);
    changed = true;
  }

  return changed ? NextResponse.redirect(target, 303) : null;
}

function enforceBrowserCsrf(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/") || SAFE_METHODS.has(request.method)) {
    return null;
  }

  const configuredOrigin = getConfiguredOrigin();
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (origin) {
    let normalizedOrigin = "";
    try {
      normalizedOrigin = new URL(origin).origin;
    } catch {
      normalizedOrigin = "";
    }

    if (!configuredOrigin || normalizedOrigin !== configuredOrigin) {
      return NextResponse.json(
        { message: "Origen de solicitud no permitido." },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
            Vary: "Origin",
          },
        },
      );
    }
  } else if (fetchSite === "cross-site") {
    return NextResponse.json(
      { message: "Solicitud entre sitios no permitida." },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Sec-Fetch-Site",
        },
      },
    );
  }

  return null;
}

function enforceRequestBodyLimit(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/") || SAFE_METHODS.has(request.method)) {
    return null;
  }

  const path = request.nextUrl.pathname;
  const maxBytes = path === "/api/uploads/forum"
    ? 82 * 1024 * 1024
    : path === "/api/uploads/avatar"
      ? 6 * 1024 * 1024
      : path === "/api/jobs/applications"
        ? 12 * 1024 * 1024
        : DEFAULT_API_BODY_LIMIT;

  if (!requestContentLengthExceeds(request, maxBytes)) {
    return null;
  }

  return NextResponse.json(
    { message: "Solicitud demasiado grande." },
    {
      status: 413,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function attachContentSecurityPolicy(response: NextResponse, policy: string) {
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);

  const sanitizedLoginRedirect = stripSensitiveLoginParams(request);
  if (sanitizedLoginRedirect) {
    return attachContentSecurityPolicy(sanitizedLoginRedirect, contentSecurityPolicy);
  }

  if (shouldForceHttps(request)) {
    const target = createCanonicalTarget(request);
    if (target) {
      return attachContentSecurityPolicy(
        NextResponse.redirect(target, 308),
        contentSecurityPolicy,
      );
    }
  }

  const bodyLimitFailure = enforceRequestBodyLimit(request);
  if (bodyLimitFailure) {
    return attachContentSecurityPolicy(bodyLimitFailure, contentSecurityPolicy);
  }

  const csrfFailure = enforceBrowserCsrf(request);
  if (csrfFailure) {
    return attachContentSecurityPolicy(csrfFailure, contentSecurityPolicy);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return attachContentSecurityPolicy(response, contentSecurityPolicy);
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
