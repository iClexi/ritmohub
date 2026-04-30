import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

type OAuthProvider = "google" | "meta";
export type OAuthFlow = "login" | "register";

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

export function getOriginFromRequest(request: Request) {
  return new URL(request.url).origin;
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
