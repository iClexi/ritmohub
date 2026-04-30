import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { deleteConcertById } from "@/lib/db";

type DeleteConcertRouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: DeleteConcertRouteProps,
) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteConcertById({
      concertId: id,
      userId: sessionPayload.session.user.id,
    });

    if (!deleted) {
      return NextResponse.json({ message: "Concierto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Concierto eliminado." });
  } catch (error) {
    console.error("concert delete error", error);
    return NextResponse.json({ message: "No pudimos eliminar el concierto." }, { status: 500 });
  }
}
