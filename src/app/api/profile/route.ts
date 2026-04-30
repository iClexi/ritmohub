import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { updateUserProfileById } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const updatedUser = await updateUserProfileById({
      userId: sessionPayload.session.user.id,
      name: parsed.data.name.trim(),
      bio: parsed.data.bio ?? "",
      musicianType: parsed.data.musicianType ?? "",
      primaryInstrument: parsed.data.primaryInstrument ?? "",
      orientation: parsed.data.orientation ?? "",
      studies: parsed.data.studies ?? "",
      avatarUrl: parsed.data.avatarUrl || undefined,
      coverUrl: parsed.data.coverUrl || undefined,
      websiteUrl: parsed.data.websiteUrl ?? "",
      location: parsed.data.location ?? "",
      socialInstagram: parsed.data.socialInstagram ?? "",
      socialSpotify: parsed.data.socialSpotify ?? "",
      socialYoutube: parsed.data.socialYoutube ?? "",
      stageName: parsed.data.stageName ?? "",
      genre: parsed.data.genre ?? "",
      tagline: parsed.data.tagline ?? "",
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "No encontramos el usuario." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Perfil actualizado.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        musicianType: updatedUser.musicianType,
        primaryInstrument: updatedUser.primaryInstrument,
        orientation: updatedUser.orientation,
        studies: updatedUser.studies,
        avatarUrl: updatedUser.avatarUrl,
        coverUrl: updatedUser.coverUrl,
        websiteUrl: updatedUser.websiteUrl,
        location: updatedUser.location,
        socialInstagram: updatedUser.socialInstagram,
        socialSpotify: updatedUser.socialSpotify,
        socialYoutube: updatedUser.socialYoutube,
        stageName: updatedUser.stageName,
        genre: updatedUser.genre,
        tagline: updatedUser.tagline,
      },
    });
  } catch {
    return NextResponse.json({ message: "No pudimos actualizar tu perfil." }, { status: 500 });
  }
}
