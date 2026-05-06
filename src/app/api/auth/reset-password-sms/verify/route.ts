import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createPasswordResetTokenRecord,
  deleteExpiredPasswordResetSmsCodes,
  deleteExpiredPasswordResetTokens,
  getValidPasswordResetSmsCodeByPhone,
  incrementPasswordResetSmsCodeAttempts,
  invalidatePasswordResetTokensForUser,
  markPasswordResetSmsCodeConsumed,
} from "@/lib/db";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { normalizePhoneNumber, verifyPasswordResetSmsSchema } from "@/lib/validations/auth";

const SMS_VERIFIED_TOKEN_TTL_MS = 15 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function checkVerifyRateLimit(request: Request, phone: string) {
  const ip = getClientIp(request);
  const ipResult = consumeRateLimit({
    key: createRateLimitKey("reset-verify", "sms", "ip", ip),
    limit: 20,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });

  if (!ipResult.allowed) {
    return rateLimitExceededResponse(ipResult.retryAfterSeconds);
  }

  const phoneResult = consumeRateLimit({
    key: createRateLimitKey("reset-verify", "sms", "phone", phone),
    limit: 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });

  if (!phoneResult.allowed) {
    return rateLimitExceededResponse(phoneResult.retryAfterSeconds);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyPasswordResetSmsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(parsed.data.phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: { phone: ["Ingresa un numero de celular valido."] },
        },
        { status: 400 },
      );
    }

    const rateLimitResponse = checkVerifyRateLimit(request, normalizedPhone);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await deleteExpiredPasswordResetSmsCodes();

    const codeRecord = await getValidPasswordResetSmsCodeByPhone(normalizedPhone);

    if (!codeRecord) {
      return NextResponse.json(
        { message: "El codigo no es valido o ya expiro." },
        { status: 400 },
      );
    }

    if (hashToken(parsed.data.code) !== codeRecord.codeHash) {
      const attempts = await incrementPasswordResetSmsCodeAttempts(codeRecord.id);
      const isBlocked = attempts >= codeRecord.maxAttempts;

      return NextResponse.json(
        {
          message: isBlocked
            ? "Ese codigo quedo bloqueado por demasiados intentos. Solicita uno nuevo."
            : "El codigo no es valido o ya expiro.",
        },
        { status: 400 },
      );
    }

    await markPasswordResetSmsCodeConsumed(codeRecord.id);

    await deleteExpiredPasswordResetTokens();
    await invalidatePasswordResetTokensForUser(codeRecord.userId);

    const token = createToken();
    await createPasswordResetTokenRecord({
      userId: codeRecord.userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SMS_VERIFIED_TOKEN_TTL_MS),
    });

    return NextResponse.json({
      message: "Codigo verificado. Ya puedes crear tu nueva contrasena.",
      token,
    });
  } catch (error) {
    console.error("reset-password-sms verify error", error);

    return NextResponse.json(
      { message: "No pudimos verificar el codigo SMS." },
      { status: 500 },
    );
  }
}
