import { NextRequest, NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createGroupChatThread } from "@/lib/db";
import { createGroupChatSchema } from "@/lib/validations/workspace";

export async function POST(req: NextRequest) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = createGroupChatSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "El nombre del grupo es requerido." }, { status: 400 });
  }

  try {
    const thread = await createGroupChatThread(
      sessionPayload.session.user.id,
      parsed.data.groupName,
      parsed.data.memberUserIds,
    );

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("[chats/groups] error:", error);
    return NextResponse.json({ message: "No se pudo crear el grupo." }, { status: 500 });
  }
}
