import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { getBandByUserId, sendBandInvitation } from "@/lib/db";
import { sendBandInvitationSchema } from "@/lib/validations/workspace";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = sendBandInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "userId requerido." }, { status: 400 });
  }
  const inviteeUserId = parsed.data.userId;

  const band = await getBandByUserId(session.session.user.id);
  if (!band) return NextResponse.json({ message: "No tienes una banda." }, { status: 404 });

  if (inviteeUserId === session.session.user.id) {
    return NextResponse.json({ message: "No puedes invitarte a ti mismo." }, { status: 400 });
  }

  const invitation = await sendBandInvitation(band.id, session.session.user.id, inviteeUserId);
  if (!invitation) {
    return NextResponse.json({ message: "Este músico ya es miembro de la banda." }, { status: 409 });
  }

  return NextResponse.json({ invitation });
}
