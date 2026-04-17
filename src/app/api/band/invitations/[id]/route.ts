import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { respondToBandInvitation } from "@/lib/db";
import { respondBandInvitationSchema } from "@/lib/validations/workspace";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = respondBandInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }
  const accept = parsed.data.accept;

  const ok = await respondToBandInvitation(id, session.session.user.id, accept);
  if (!ok) return NextResponse.json({ message: "Invitación no encontrada o ya procesada." }, { status: 404 });

  return NextResponse.json({ ok: true, accepted: accept });
}
