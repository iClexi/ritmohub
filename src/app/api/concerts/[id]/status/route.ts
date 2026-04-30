import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { updateConcertStatusById } from "@/lib/db";
import { updateConcertStatusSchema } from "@/lib/validations/workspace";

type UpdateConcertStatusRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: UpdateConcertStatusRouteProps,
) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateConcertStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Estado de concierto invalido.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = await params;
    const concert = await updateConcertStatusById({
      concertId: id,
      userId: sessionPayload.session.user.id,
      status: parsed.data.status,
    });

    if (!concert) {
      return NextResponse.json({ message: "Concierto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Estado actualizado.", concert });
  } catch (error) {
    console.error("concert status error", error);
    return NextResponse.json({ message: "No pudimos actualizar el estado." }, { status: 500 });
  }
}
