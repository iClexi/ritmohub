import { NextResponse } from "next/server";

import { createOAuthState, getOriginFromRequest, setOAuthStateCookie } from "@/lib/auth/oauth";

export async function GET(request: Request) {
  const origin = getOriginFromRequest(request);
  const clientId = process.env.META_CLIENT_ID?.trim();

  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?oauthError=meta_not_configured`);
  }

  const redirectUri = `${origin}/api/auth/oauth/meta/callback`;
  const state = createOAuthState();
  await setOAuthStateCookie("meta", state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "email,public_profile",
    response_type: "code",
  });

  return NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
}
