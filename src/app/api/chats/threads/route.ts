import { NextRequest, NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createOrGetDirectThread, listChatThreadsWithMessagesByUser } from "@/lib/db";
import { createDirectChatThreadSchema } from "@/lib/validations/workspace";

const privateJsonOptions = {
  headers: {
    "Cache-Control": "no-store",
  },
};

export async function GET() {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json(
      { message: "Debes iniciar sesion.", threads: [] },
      { status: 401, ...privateJsonOptions },
    );
  }

  return NextResponse.json(
    {
      threads: await listChatThreadsWithMessagesByUser(sessionPayload.session.user.id),
    },
    privateJsonOptions,
  );
}

export async function POST(req: NextRequest) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = createDirectChatThreadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "contactUserId es requerido." }, { status: 400 });
  }

  const contactUserId = parsed.data.contactUserId;

  const userId = sessionPayload.session.user.id;

  if (userId === contactUserId) {
    return NextResponse.json({ message: "No puedes chatear contigo mismo." }, { status: 400 });
  }

  try {
    const thread = await createOrGetDirectThread(userId, contactUserId);
    return NextResponse.json({ thread });
  } catch (error) {
    console.error("[chats/threads POST] error:", error);
    return NextResponse.json({ message: "No se pudo crear el hilo de chat." }, { status: 500 });
  }
}
