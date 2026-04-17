import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { consumeOAuthStateCookie, getOriginFromRequest } from "@/lib/auth/oauth";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createUser, getUserByEmail } from "@/lib/db";

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleUserInfoResponse = {
  email?: string;
  name?: string;
};

export async function GET(request: Request) {
  const origin = getOriginFromRequest(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(`${origin}/login?oauthError=google_${providerError}`);
  }

  const expectedState = await consumeOAuthStateCookie("google");
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/login?oauthError=google_invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?oauthError=google_missing_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?oauthError=google_not_configured`);
  }

  const redirectUri = `${origin}/api/auth/oauth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenPayload = (await tokenResponse.json().catch(() => null)) as GoogleTokenResponse | null;
  const accessToken = tokenPayload?.access_token;
  if (!tokenResponse.ok || !accessToken) {
    return NextResponse.redirect(`${origin}/login?oauthError=google_token_error`);
  }

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const userPayload = (await userResponse.json().catch(() => null)) as GoogleUserInfoResponse | null;
  const email = userPayload?.email?.trim().toLowerCase();
  const name = userPayload?.name?.trim();

  if (!userResponse.ok || !email) {
    return NextResponse.redirect(`${origin}/login?oauthError=google_profile_error`);
  }

  let user = await getUserByEmail(email);
  if (!user) {
    const passwordHash = await hashPassword(randomBytes(24).toString("base64url"));
    user = await createUser({
      name: name && name.length > 1 ? name : email.split("@")[0] ?? "Musico",
      email,
      passwordHash,
    });
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return NextResponse.redirect(`${origin}/dashboard`);
}
