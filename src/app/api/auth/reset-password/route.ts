import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import {
  deleteSessionsByUserId,
  getValidPasswordResetTokenByHash,
  markPasswordResetTokenUsed,
  updateUserPasswordHashById,
} from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const tokenRecord = await getValidPasswordResetTokenByHash(hashToken(parsed.data.token));

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "El enlace de recuperación expiró o ya fue usado." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const updated = await updateUserPasswordHashById(tokenRecord.userId, passwordHash);

    if (!updated) {
      return NextResponse.json(
        { message: "No pudimos actualizar la contraseña." },
        { status: 500 },
      );
    }

    await markPasswordResetTokenUsed(tokenRecord.id);
    await deleteSessionsByUserId(tokenRecord.userId);

    return NextResponse.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("reset password error", error);

    return NextResponse.json(
      { message: "No pudimos actualizar la contraseña." },
      { status: 500 },
    );
  }
}
