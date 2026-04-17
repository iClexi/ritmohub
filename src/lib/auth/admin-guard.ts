import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { isAdminUserId } from "@/lib/db";

export async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return { ok: false, response: NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 }) };
  }
  const userId = sessionPayload.session.user.id;
  const allowed = await isAdminUserId(userId);
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ message: "No autorizado." }, { status: 403 }) };
  }
  return { ok: true, userId };
}
