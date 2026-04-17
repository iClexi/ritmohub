import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionFromCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!hasToken) {
    return NextResponse.json({ authenticated: false, invalidated: false });
  }

  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    // In route handlers cookie mutation is allowed.
    await clearSessionCookie();
    return NextResponse.json({
      authenticated: false,
      invalidated: true,
      message: "Tu usuario fue eliminado.",
    });
  }

  return NextResponse.json({ authenticated: true, invalidated: false });
}
