import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createConcert, listConcertsByUser, listPublicConcerts } from "@/lib/db";
import { createConcertSchema } from "@/lib/validations/workspace";

export async function GET() {
  return NextResponse.json({ concerts: await listPublicConcerts(200) });
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createConcertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del concierto.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const normalizeText = (value: string) => value.trim().toLowerCase();
    const normalizeExact = (value: string) => value.trim();
    const userId = sessionPayload.session.user.id;

    const existingConcerts = await listConcertsByUser(userId);
    const hasDuplicateBySameCreator = existingConcerts.some((concert) => {
      return (
        normalizeText(concert.title) === normalizeText(parsed.data.title) &&
        normalizeExact(concert.date) === normalizeExact(parsed.data.date) &&
        normalizeText(concert.venue) === normalizeText(parsed.data.venue) &&
        normalizeText(concert.city) === normalizeText(parsed.data.city) &&
        normalizeText(concert.flyerUrl) === normalizeText(parsed.data.flyerUrl) &&
        normalizeText(concert.ticketUrl) === normalizeText(parsed.data.ticketUrl) &&
        normalizeExact(concert.capacity) === normalizeExact(parsed.data.capacity)
      );
    });

    if (hasDuplicateBySameCreator) {
      return NextResponse.json(
        { message: "Ya tienes un concierto igual con esas características." },
        { status: 409 },
      );
    }

    const concert = await createConcert({
      userId,
      title: parsed.data.title,
      date: parsed.data.date,
      venue: parsed.data.venue,
      city: parsed.data.city,
      flyerUrl: parsed.data.flyerUrl,
      ticketUrl: parsed.data.ticketUrl,
      capacity: parsed.data.capacity,
      status: "lead",
    });

    return NextResponse.json({ message: "Concierto publicado.", concert });
  } catch (error) {
    console.error("concert create error", error);
    return NextResponse.json({ message: "No pudimos publicar el concierto." }, { status: 500 });
  }
}
