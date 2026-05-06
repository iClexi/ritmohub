import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  deleteExpiredPendingPhoneChangeCodes,
  getValidPendingPhoneChangeCodeByUserId,
  incrementPendingPhoneChangeCodeAttempts,
  markPendingPhoneChangeCodeConsumed,
  updateUserPhoneById,
} from "@/lib/db";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const userId = sessionPayload.session.user.id;

  const ip = getClientIp(request);
  const ipResult = consumeRateLimit({
    key: createRateLimitKey("change-contact", "verify-phone", "ip", ip),
    limit: 20,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });
  if (!ipResult.allowed) return rateLimitExceededResponse(ipResult.retryAfterSeconds);

  const userResult = consumeRateLimit({
    key: createRateLimitKey("change-contact", "verify-phone", "user", userId),
    limit: 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });
  if (!userResult.allowed) return rateLimitExceededResponse(userResult.retryAfterSeconds);

  try {
    const body = await request.json() as { code?: string };
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ message: "Ingresa el codigo de 6 digitos." }, { status: 400 });
    }

    await deleteExpiredPendingPhoneChangeCodes();

    const codeRecord = await getValidPendingPhoneChangeCodeByUserId(userId);
    if (!codeRecord) {
      return NextResponse.json(
        { message: "El codigo no es valido o ya expiro. Solicita uno nuevo." },
        { status: 400 },
      );
    }

    if (hashToken(code) !== codeRecord.codeHash) {
      const attempts = await incrementPendingPhoneChangeCodeAttempts(codeRecord.id);
      const isBlocked = attempts >= codeRecord.maxAttempts;
      return NextResponse.json(
        {
          message: isBlocked
            ? "Codigo bloqueado por demasiados intentos incorrectos. Solicita uno nuevo."
            : "Codigo incorrecto. Intentalo de nuevo.",
        },
        { status: 400 },
      );
    }

    await markPendingPhoneChangeCodeConsumed(codeRecord.id);
    await updateUserPhoneById(userId, codeRecord.newPhone);

    return NextResponse.json({
      message: "Telefono actualizado correctamente.",
    });
  } catch (error) {
    console.error("verify-phone-change error", error);
    return NextResponse.json({ message: "No pudimos verificar el codigo." }, { status: 500 });
  }
}
