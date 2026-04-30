import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { requireSeedAccess } from "@/lib/auth/seed-guard";
import {
  createUser,
  getUserByEmail,
  updateUserForAdmin,
  updateUserPasswordHashById,
} from "@/lib/db";

const ADMIN_NAME = "Adrian Alcantara";
const ADMIN_USERNAME = "adrian-alcantara-admin";
const ADMIN_EMAIL = "adriancalcantara@itla.edu.do";
const LEGACY_ADMIN_EMAILS = [
  "adriancalcantara@itlab.edu.do",
  "adriancalcántara@itlab.edu.do",
  "adriancalcántara@itla.edu.do",
];
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD?.trim();

export async function POST(request: Request) {
  const guardResponse = requireSeedAccess(request);
  if (guardResponse) {
    return guardResponse;
  }

  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { message: "Define ADMIN_SEED_PASSWORD antes de crear el admin." },
      { status: 500 },
    );
  }

  try {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const existing = await getUserByEmail(ADMIN_EMAIL);

    if (existing) {
      await updateUserForAdmin({
        userId: existing.id,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        stageName: ADMIN_USERNAME,
        role: "admin",
        musicianType: existing.musicianType,
        primaryInstrument: existing.primaryInstrument,
        bio: existing.bio,
      });
      await updateUserPasswordHashById(existing.id, passwordHash);
      return NextResponse.json({
        message: "Admin ya existe. Perfil y contrasena actualizados.",
        status: "updated",
      });
    }

    let legacy = null;
    for (const legacyEmail of LEGACY_ADMIN_EMAILS) {
      legacy = await getUserByEmail(legacyEmail);
      if (legacy) {
        break;
      }
    }

    if (legacy) {
      await updateUserForAdmin({
        userId: legacy.id,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        stageName: ADMIN_USERNAME,
        role: "admin",
        musicianType: legacy.musicianType,
        primaryInstrument: legacy.primaryInstrument,
        bio: legacy.bio,
      });
      await updateUserPasswordHashById(legacy.id, passwordHash);

      return NextResponse.json({
        message: "Admin migrado a correo sin tilde. Contrasena actualizada.",
        status: "migrated",
      });
    }

    await createUser({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });

    return NextResponse.json({
      message: "Admin creado.",
      status: "created",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { message: "No se pudo crear el admin.", error: message },
      { status: 500 },
    );
  }
}
