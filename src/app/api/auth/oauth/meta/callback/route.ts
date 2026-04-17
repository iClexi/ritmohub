import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { consumeOAuthStateCookie, getOriginFromRequest } from "@/lib/auth/oauth";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createUser, getUserByEmail } from "@/lib/db";

type MetaTokenResponse = {
  access_token?: string;
};

type MetaUserResponse = {
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
    return NextResponse.redirect(`${origin}/login?oauthError=meta_${providerError}`);
  }

  const expectedState = await consumeOAuthStateCookie("meta");
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/login?oauthError=meta_invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?oauthError=meta_missing_code`);
  }

  const clientId = process.env.META_CLIENT_ID?.trim();
  const clientSecret = process.env.META_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?oauthError=meta_not_configured`);
  }

  const redirectUri = `${origin}/api/auth/oauth/meta/callback`;
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`);
  const tokenPayload = (await tokenResponse.json().catch(() => null)) as MetaTokenResponse | null;
  const accessToken = tokenPayload?.access_token;
  if (!tokenResponse.ok || !accessToken) {
    return NextResponse.redirect(`${origin}/login?oauthError=meta_token_error`);
  }

  const userParams = new URLSearchParams({
    fields: "id,name,email",
    access_token: accessToken,
  });
  const userResponse = await fetch(`https://graph.facebook.com/me?${userParams.toString()}`);
  const userPayload = (await userResponse.json().catch(() => null)) as MetaUserResponse | null;

  const email = userPayload?.email?.trim().toLowerCase();
  const name = userPayload?.name?.trim();

  if (!userResponse.ok || !email) {
    return NextResponse.redirect(`${origin}/login?oauthError=meta_email_required`);
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
