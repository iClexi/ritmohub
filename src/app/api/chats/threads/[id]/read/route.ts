import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { markThreadMessagesReadByUser } from "@/lib/db";

type ChatReadRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: ChatReadRouteProps) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const { id } = await params;
    await markThreadMessagesReadByUser({
      userId: sessionPayload.session.user.id,
      threadId: id,
    });

    return NextResponse.json({ message: "Mensajes marcados como leidos." });
  } catch (error) {
    console.error("chat read error", error);
    return NextResponse.json({ message: "No pudimos marcar como leido." }, { status: 500 });
  }
}
