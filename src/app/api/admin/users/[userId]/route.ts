import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { hashPassword } from "@/lib/auth/password";
import {
  deleteUserById,
  getAdminUserById,
  listRecentVisitsForUser,
  updateUserForAdmin,
  updateUserPasswordHashById,
} from "@/lib/db";

type Props = { params: Promise<{ userId: string }> };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phoneRaw = typeof body?.phone === "string" ? body.phone.trim() : "";
    const phone = phoneRaw === "" ? null : phoneRaw;
    const stageName = String(body?.stageName ?? "").trim();
    const role = body?.role === "admin" ? "admin" : "user";
    const musicianType = String(body?.musicianType ?? "").trim();
    const primaryInstrument = String(body?.primaryInstrument ?? "").trim();
    const bio = String(body?.bio ?? "").trim();
    const location = String(body?.location ?? "").trim();
    const websiteUrl = String(body?.websiteUrl ?? "").trim();
    const socialInstagram = String(body?.socialInstagram ?? "").trim();
    const socialSpotify = String(body?.socialSpotify ?? "").trim();
    const socialYoutube = String(body?.socialYoutube ?? "").trim();
    const genre = String(body?.genre ?? "").trim();
    const tagline = String(body?.tagline ?? "").trim();
    const nextPassword = String(body?.password ?? "");

    if (!name || !email) {
      return NextResponse.json({ message: "Nombre y correo son obligatorios." }, { status: 400 });
    }

    if (!emailPattern.test(email)) {
      return NextResponse.json({ message: "El correo no es valido." }, { status: 400 });
    }

    if (guard.userId === userId && role !== "admin") {
      return NextResponse.json(
        { message: "No puedes quitarte el rol admin a ti mismo." },
        { status: 400 },
      );
    }

    if (nextPassword && nextPassword.length < 6) {
      return NextResponse.json(
        { message: "La nueva contraseña debe tener al menos 6 caracteres." },
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
