import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  deleteSessionsByUserId,
  getValidPendingContactChange,
  markPendingContactChangeUsed,
  updateUserEmailById,
  updateUserPhoneById,
} from "@/lib/db";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ message: "Token requerido." }, { status: 400 });
    }

    const record = await getValidPendingContactChange(hashToken(token));

    if (!record) {
      return NextResponse.json(
        { message: "El enlace de confirmacion expiro o ya fue usado." },
        { status: 400 },
      );
    }

    if (record.field === "email") {
      const updated = await updateUserEmailById(record.userId, record.newValue);
      if (!updated) {
        return NextResponse.json({ message: "No se pudo actualizar el correo." }, { status: 500 });
      }
      await markPendingContactChangeUsed(record.id);
      await deleteSessionsByUserId(record.userId);
      return NextResponse.json({
        message: "Correo actualizado correctamente. Por favor inicia sesion de nuevo.",
        field: "email",
      });
    }

    if (record.field === "phone") {
      const updated = await updateUserPhoneById(record.userId, record.newValue);
      if (!updated) {
        return NextResponse.json({ message: "No se pudo actualizar el telefono." }, { status: 500 });
      }
      await markPendingContactChangeUsed(record.id);
      return NextResponse.json({
        message: "Telefono actualizado correctamente.",
        field: "phone",
      });
    }

    return NextResponse.json({ message: "Campo no valido." }, { status: 400 });
  } catch (error) {
    console.error("change-contact verify error", error);
    return NextResponse.json({ message: "No pudimos procesar la verificacion." }, { status: 500 });
  }
}
