import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

type OAuthProvider = "google" | "meta";

function getStateCookieName(provider: OAuthProvider) {
  return `oauth_state_${provider}`;
}

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

export function getOriginFromRequest(request: Request) {
  return new URL(request.url).origin;
}

export async function setOAuthStateCookie(provider: OAuthProvider, state: string) {
  const cookieStore = await cookies();
  cookieStore.set(getStateCookieName(provider), state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function consumeOAuthStateCookie(provider: OAuthProvider) {
  const cookieStore = await cookies();
  const key = getStateCookieName(provider);
  const value = cookieStore.get(key)?.value ?? null;

  cookieStore.set(key, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return value;
}
