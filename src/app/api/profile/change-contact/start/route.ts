import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  createPendingContactChange,
  createPendingPhoneChangeCode,
  deleteExpiredPendingContactChanges,
  deleteExpiredPendingPhoneChangeCodes,
  getUserByEmail,
  invalidatePendingContactChangesForUser,
  invalidatePendingPhoneChangeCodesForUser,
} from "@/lib/db";
import { buildContactChangeUrl, sendContactChangeEmail } from "@/lib/email/contact-change";
import { sendPhoneChangeSms } from "@/lib/sms/phone-change";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { normalizePhoneNumber } from "@/lib/validations/auth";

const CHANGE_TOKEN_TTL_MS = 30 * 60 * 1000;
const PHONE_CODE_TTL_MS = 15 * 60 * 1000;
const PHONE_CODE_MAX_ATTEMPTS = 5;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function createSmsCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const user = sessionPayload.session.user;

  const ip = getClientIp(request);
  const ipResult = consumeRateLimit({
    key: createRateLimitKey("change-contact", "start", "ip", ip),
    limit: 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });
  if (!ipResult.allowed) return rateLimitExceededResponse(ipResult.retryAfterSeconds);

  const userResult = consumeRateLimit({
    key: createRateLimitKey("change-contact", "start", "user", user.id),
    limit: 5,
    windowMs: 30 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  });
  if (!userResult.allowed) return rateLimitExceededResponse(userResult.retryAfterSeconds);

  try {
    const body = await request.json() as { field?: string; newValue?: string; phoneCountry?: string };
    const field = body.field;
    const newValue = typeof body.newValue === "string" ? body.newValue.trim() : "";
    const phoneCountry = typeof body.phoneCountry === "string" ? body.phoneCountry.trim() : undefined;

    if (field !== "email" && field !== "phone") {
      return NextResponse.json({ message: "Campo no valido." }, { status: 400 });
    }

    if (!newValue) {
      return NextResponse.json({ message: "El nuevo valor es obligatorio." }, { status: 400 });
    }

    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue)) {
        return NextResponse.json({ message: "El correo electronico no es valido." }, { status: 400 });
      }
      const normalized = newValue.toLowerCase();
      if (normalized === user.email.toLowerCase()) {
        return NextResponse.json({ message: "Este ya es tu correo actual." }, { status: 400 });
      }
      const existing = await getUserByEmail(normalized);
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ message: "Este correo ya esta en uso por otra cuenta." }, { status: 400 });
      }

      await deleteExpiredPendingContactChanges();
      await invalidatePendingContactChangesForUser(user.id);

      const token = createToken();
      await createPendingContactChange({
        userId: user.id,
        field: "email",
        newValue: normalized,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + CHANGE_TOKEN_TTL_MS),
      });

      await sendContactChangeEmail({
        to: normalized,
        name: user.name,
        field: "email",
        newValue: normalized,
        confirmUrl: buildContactChangeUrl(token),
      });

      return NextResponse.json({
        message: "Te enviamos un correo a la nueva direccion para confirmar el cambio.",
      });
    }

    // Phone: normalize and send SMS
    const normalizedPhone = normalizePhoneNumber(newValue, phoneCountry);
    if (!normalizedPhone) {
      return NextResponse.json(
        { message: "Ingresa un numero de telefono valido para el pais seleccionado." },
        { status: 400 },
      );
    }

    await deleteExpiredPendingPhoneChangeCodes();
    await invalidatePendingPhoneChangeCodesForUser(user.id);

    const code = createSmsCode();
    await createPendingPhoneChangeCode({
      userId: user.id,
      newPhone: normalizedPhone,
      codeHash: hashToken(code),
      maxAttempts: PHONE_CODE_MAX_ATTEMPTS,
      expiresAt: new Date(Date.now() + PHONE_CODE_TTL_MS),
    });

    await sendPhoneChangeSms({ recipient: normalizedPhone, code });

    return NextResponse.json({
      message: "Te enviamos un codigo SMS al nuevo numero. Ingresalo para confirmar el cambio.",
    });
  } catch (error) {
    console.error("change-contact start error", error);
    return NextResponse.json({ message: "No pudimos procesar la solicitud." }, { status: 500 });
  }
}
