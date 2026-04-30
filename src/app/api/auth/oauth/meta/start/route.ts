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
  const clientId = process.env.META_CLIENT_ID?.trim();

  if (!clientId) {
    return NextResponse.redirect(`${origin}${getOAuthErrorRedirectPath(flow, "meta_not_configured")}`);
  }

  const redirectUri = `${origin}/api/auth/oauth/meta/callback`;
  const state = createOAuthState();
  await setOAuthStateCookie("meta", state, flow);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "email,public_profile",
    response_type: "code",
    auth_type: "rerequest",
  });

  return NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
}
