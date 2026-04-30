import { NextRequest, NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { searchUsers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion.", users: [] }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  const users = await searchUsers(q, sessionPayload.session.user.id, 20);

  return NextResponse.json({ users });
}
