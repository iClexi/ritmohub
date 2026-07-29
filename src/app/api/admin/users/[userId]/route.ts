import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { hashPassword } from "@/lib/auth/password";
import {
  deleteUserById,
  getAdminUserById,
  listRecentVisitsForUser,
  updateUserForAdmin,
  updateUserPasswordHashById,
} from "@/lib/db";
import { isSafeHttpsUrl, isSafeWebUrl } from "@/lib/security/url";
import { passwordSchema } from "@/lib/validations/auth";

type Props = { params: Promise<{ userId: string }> };

const optionalText = (max: number) => z.string().trim().max(max).default("");
const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(32).regex(/^\+?[\d\s()-]*$/).default(""),
  stageName: optionalText(60),
  role: z.enum(["user", "admin"]),
  musicianType: optionalText(60),
  primaryInstrument: optionalText(60),
  bio: optionalText(1000),
  location: optionalText(100),
  websiteUrl: z.string().trim().max(400).refine((value) => !value || isSafeWebUrl(value)).default(""),
  socialInstagram: z.string().trim().max(80).regex(/^@?[a-zA-Z0-9_.]*$/).default(""),
  socialSpotify: z.string().trim().max(400).refine((value) => !value || isSafeHttpsUrl(value)).default(""),
  socialYoutube: z.string().trim().max(400).refine((value) => !value || isSafeHttpsUrl(value)).default(""),
  genre: optionalText(80),
  tagline: optionalText(180),
  password: z.union([z.literal(""), passwordSchema]).default(""),
});

export async function GET(_request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return guard.response;
  }

  const { userId } = await params;
  const user = await getAdminUserById(userId);
  if (!user) {
    return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
  }

  const visits = await listRecentVisitsForUser(userId, 25);
  return NextResponse.json({ user, visits });
}

export async function PATCH(request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { userId } = await params;
    const parsed = adminUpdateUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los datos del usuario.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      stageName,
      role,
      musicianType,
      primaryInstrument,
      bio,
      location,
      websiteUrl,
      socialInstagram,
      socialSpotify,
      socialYoutube,
      genre,
      tagline,
      password: nextPassword,
    } = parsed.data;
    const phoneRaw = parsed.data.phone;
    const phone = phoneRaw === "" ? null : phoneRaw;

    if (guard.userId === userId && role !== "admin") {
      return NextResponse.json(
        { message: "No puedes quitarte el rol admin a ti mismo." },
        { status: 400 },
      );
    }

    const updatedUser = await updateUserForAdmin({
      userId,
      name,
      email,
      phone,
      stageName,
      role,
      musicianType,
      primaryInstrument,
      bio,
      location,
      websiteUrl,
      socialInstagram,
      socialSpotify,
      socialYoutube,
      genre,
      tagline,
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
    }

    if (nextPassword) {
      const passwordHash = await hashPassword(nextPassword);
      await updateUserPasswordHashById(userId, passwordHash);
    }

    return NextResponse.json({
      message: nextPassword
        ? "Usuario y contraseña actualizados."
        : "Usuario actualizado.",
      user: updatedUser,
    });
  } catch (error) {
    const maybePgError = error as { code?: string };
    if (maybePgError.code === "23505") {
      return NextResponse.json(
        { message: "El correo o nombre artistico ya existe." },
        { status: 409 },
      );
    }

    console.error("admin update user error", error);
    return NextResponse.json(
      { message: "No pudimos actualizar el usuario." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return guard.response;
  }

  const { userId } = await params;

  if (guard.userId === userId) {
    return NextResponse.json(
      { message: "No puedes eliminar tu propio usuario admin." },
      { status: 400 },
    );
  }

  const deleted = await deleteUserById(userId);
  if (!deleted) {
    return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ message: "Usuario eliminado." });
}
