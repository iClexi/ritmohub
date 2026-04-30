import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  getBandByUserId,
  createBand,
  disbandBand,
  leaveBand,
  getPendingInvitationsForUser,
  getBandPendingInvitations,
  setSoloMode,
  updateBandBranding,
} from "@/lib/db";
import {
  createBandSchema,
  deleteBandSchema,
  updateSoloModeSchema,
  updateBandBrandingSchema,
} from "@/lib/validations/workspace";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const userId = session.session.user.id;
  const [band, incomingInvitations] = await Promise.all([
    getBandByUserId(userId),
    getPendingInvitationsForUser(userId),
  ]);
  const sentInvitations = band ? await getBandPendingInvitations(band.id) : [];

  return NextResponse.json({ band, incomingInvitations, sentInvitations, isSolo: session.session.user.isSolo });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createBandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Nombre de banda inválido (2-80 caracteres)." }, { status: 400 });
  }
  const name = parsed.data.name;

  const existing = await getBandByUserId(session.session.user.id);
  if (existing) {
    return NextResponse.json({ message: "Ya perteneces a una banda." }, { status: 409 });
  }

  const band = await createBand(name, session.session.user.id);
  return NextResponse.json({ band });
}

export async function DELETE(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = deleteBandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Solicitud inválida para gestionar la banda." }, { status: 400 });
  }

  const { action, bandId } = parsed.data;

  if (action === "disband") {
    const ok = await disbandBand(bandId, session.session.user.id);
    if (!ok) return NextResponse.json({ message: "Solo el creador puede disolver la banda." }, { status: 403 });
  } else {
    await leaveBand(bandId, session.session.user.id);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);

  // Solo mode toggle
  const soloParsed = updateSoloModeSchema.safeParse(body);
  if (soloParsed.success) {
    await setSoloMode(session.session.user.id, soloParsed.data.isSolo);
    return NextResponse.json({ ok: true });
  }

  // Band branding update
  const brandingParsed = updateBandBrandingSchema.safeParse(body);
  if (brandingParsed.success) {
    const { bandId, ...data } = brandingParsed.data;
    const ok = await updateBandBranding(bandId, session.session.user.id, {
      name: data.name,
      genre: data.genre,
      bio: data.bio,
      logoUrl: data.logoUrl,
      bannerUrl: data.bannerUrl,
      bannerFit: data.bannerFit,
    });
    if (!ok) return NextResponse.json({ message: "No tienes permiso para editar esta banda." }, { status: 403 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Acción no reconocida." }, { status: 400 });
}
