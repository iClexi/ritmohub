import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

type OAuthProvider = "google" | "meta";
export type OAuthFlow = "login" | "register";
const PRODUCTION_ORIGIN = "https://ritmohub.iclexi.tech";

function getStateCookieName(provider: OAuthProvider) {
  return `oauth_state_${provider}`;
}

function getFlowCookieName(provider: OAuthProvider) {
  return `oauth_flow_${provider}`;
}

function getOAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

function getConfiguredPublicOrigin() {
  const candidates = [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value || !URL.canParse(value)) {
      continue;
    }

    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    ) {
      continue;
    }

    return url.origin;
  }

  return process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : null;
}

export function getOriginFromRequest(request: Request) {
  const configuredOrigin = getConfiguredPublicOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedHost) {
    const protocol = forwardedProto || url.protocol.replace(":", "");
    return `${protocol}://${forwardedHost}`;
  }

  return url.origin;
}

export function getOAuthFlowFromRequest(request: Request): OAuthFlow {
  const flow = new URL(request.url).searchParams.get("flow")?.trim().toLowerCase();
  return flow === "register" ? "register" : "login";
}

export function getOAuthErrorRedirectPath(flow: OAuthFlow, errorCode: string) {
  return `/${flow}?oauthError=${encodeURIComponent(errorCode)}`;
}

export async function setOAuthStateCookie(provider: OAuthProvider, state: string, flow: OAuthFlow = "login") {
  const cookieStore = await cookies();
  const options = getOAuthCookieOptions(60 * 10);
  cookieStore.set(getStateCookieName(provider), state, options);
  cookieStore.set(getFlowCookieName(provider), flow, options);
}

export async function consumeOAuthStateCookie(provider: OAuthProvider) {
  const cookieStore = await cookies();
  const key = getStateCookieName(provider);
  const value = cookieStore.get(key)?.value ?? null;

  cookieStore.set(key, "", getOAuthCookieOptions(0));

  return value;
}

export async function consumeOAuthFlowCookie(provider: OAuthProvider): Promise<OAuthFlow> {
  const cookieStore = await cookies();
  const key = getFlowCookieName(provider);
  const value = cookieStore.get(key)?.value ?? null;

  cookieStore.set(key, "", getOAuthCookieOptions(0));

  return value === "register" ? "register" : "login";
}
