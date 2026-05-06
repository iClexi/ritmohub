import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import {
  consumeOAuthFlowCookie,
  consumeOAuthStateCookie,
  getOAuthErrorRedirectPath,
  getOriginFromRequest,
  type OAuthFlow,
} from "@/lib/auth/oauth";
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

function redirectWithOAuthError(origin: string, flow: OAuthFlow, errorCode: string) {
  return NextResponse.redirect(`${origin}${getOAuthErrorRedirectPath(flow, errorCode)}`);
}

function isPgUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

function getUsernameBase(email: string) {
  const localPart = email.split("@")[0]?.trim() || "musico";
  const normalized = localPart
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, "_")
    .replaceAll(/_+/g, "_")
    .replaceAll(/^_+|_+$/g, "");

  return normalized.length >= 3 ? normalized.slice(0, 30) : `user_${randomBytes(2).toString("hex")}`;
}

function buildUsernameCandidate(base: string, attempt: number) {
  if (attempt === 0) {
    return base.slice(0, 30);
  }

  const suffix = `_${randomBytes(3).toString("hex")}`;
  return `${base.slice(0, 30 - suffix.length)}${suffix}`;
}

async function createUserFromMetaProfile(input: { email: string; name?: string }) {
  const passwordHash = await hashPassword(randomBytes(24).toString("base64url"));
  const fallbackName = input.email.split("@")[0]?.trim() || "Musico";
  const name = input.name && input.name.length > 1 ? input.name : fallbackName;
  const usernameBase = getUsernameBase(input.email);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await createUser({
        name,
        username: buildUsernameCandidate(usernameBase, attempt),
        email: input.email,
        passwordHash,
        authProvider: "meta",
      });
    } catch (error) {
      if (!isPgUniqueViolation(error)) {
        throw error;
      }

      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        return existingUser;
      }
    }
  }

  throw new Error("No se pudo generar un username unico para Meta OAuth.");
}

export async function GET(request: Request) {
  const origin = getOriginFromRequest(request);
  let flow: OAuthFlow = "login";

  try {
    flow = await consumeOAuthFlowCookie("meta");
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const providerError = url.searchParams.get("error");

    if (providerError) {
      await consumeOAuthStateCookie("meta");
      return redirectWithOAuthError(origin, flow, `meta_${providerError}`);
    }

    const expectedState = await consumeOAuthStateCookie("meta");
    if (!state || !expectedState || state !== expectedState) {
      return redirectWithOAuthError(origin, flow, "meta_invalid_state");
    }

    if (!code) {
      return redirectWithOAuthError(origin, flow, "meta_missing_code");
    }

    const clientId = process.env.META_CLIENT_ID?.trim();
    const clientSecret = process.env.META_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      return redirectWithOAuthError(origin, flow, "meta_not_configured");
    }

    const redirectUri = `${origin}/api/auth/oauth/meta/callback`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`,
      { cache: "no-store" },
    );
    const tokenPayload = (await tokenResponse.json().catch(() => null)) as MetaTokenResponse | null;
    const accessToken = tokenPayload?.access_token;
    if (!tokenResponse.ok || !accessToken) {
      return redirectWithOAuthError(origin, flow, "meta_token_error");
    }

    const userParams = new URLSearchParams({
      fields: "id,name,email",
      access_token: accessToken,
    });
    const userResponse = await fetch(`https://graph.facebook.com/me?${userParams.toString()}`, {
      cache: "no-store",
    });
    const userPayload = (await userResponse.json().catch(() => null)) as MetaUserResponse | null;

    const email = userPayload?.email?.trim().toLowerCase();
    const name = userPayload?.name?.trim();

    if (!userResponse.ok || !email) {
      return redirectWithOAuthError(origin, flow, "meta_email_required");
    }

    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUserFromMetaProfile({ email, name });
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error("meta oauth error", error);
    return redirectWithOAuthError(origin, flow, "meta_unexpected_error");
  }
}
