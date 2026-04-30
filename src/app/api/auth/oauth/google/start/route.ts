import { NextResponse } from "next/server";

import {
  createOAuthState,
  getOAuthErrorRedirectPath,
  getOAuthFlowFromRequest,
  getOriginFromRequest,
  setOAuthStateCookie,
} from "@/lib/auth/oauth";

export async function GET(request: Request) {
  const origin = getOriginFromRequest(request);
  const flow = getOAuthFlowFromRequest(request);
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    return NextResponse.redirect(`${origin}${getOAuthErrorRedirectPath(flow, "google_not_configured")}`);
  }

  const redirectUri = `${origin}/api/auth/oauth/google/callback`;
  const state = createOAuthState();
  await setOAuthStateCookie("google", state, flow);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
