import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createChatMessageForThread } from "@/lib/db";
import { createChatMessageSchema } from "@/lib/validations/workspace";

type ChatMessageRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: ChatMessageRouteProps) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createChatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Mensaje invalido.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = await params;
    const message = await createChatMessageForThread({
      userId: sessionPayload.session.user.id,
      threadId: id,
      senderType: "me",
      text: parsed.data.text,
      isUnread: false,
    });

    if (!message) {
      return NextResponse.json({ message: "Chat no encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Mensaje enviado.",
      sent: message,
    });
  } catch (error) {
    console.error("chat message error", error);
    return NextResponse.json({ message: "No pudimos enviar el mensaje." }, { status: 500 });
  }
}
