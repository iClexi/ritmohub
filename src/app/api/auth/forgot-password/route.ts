import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { buildPasswordResetUrl, sendPasswordResetEmail } from "@/lib/email/password-reset";
import { sendPasswordResetSms } from "@/lib/sms/password-reset";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import {
  createPasswordResetSmsCodeRecord,
  createPasswordResetTokenRecord,
  deleteExpiredPasswordResetSmsCodes,
  deleteExpiredPasswordResetTokens,
  getUserByEmail,
  getUserByPhone,
  invalidatePasswordResetSmsCodesForUser,
  invalidatePasswordResetTokensForUser,
} from "@/lib/db";
import { forgotPasswordSchema, forgotPasswordSmsSchema, normalizePhoneNumber } from "@/lib/validations/auth";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_SMS_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_SMS_MAX_ATTEMPTS = 5;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function createSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function checkForgotPasswordRateLimit(request: Request, channel: "email" | "sms", target: string) {
  const ip = getClientIp(request);
  const ipResult = consumeRateLimit({
    key: createRateLimitKey("forgot", channel, "ip", ip),
    limit: channel === "email" ? 12 : 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });

  if (!ipResult.allowed) {
    return rateLimitExceededResponse(ipResult.retryAfterSeconds);
  }

  const targetResult = consumeRateLimit({
    key: createRateLimitKey("forgot", channel, "target", target),
    limit: channel === "email" ? 5 : 4,
    windowMs: 30 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  });

  if (!targetResult.allowed) {
    return rateLimitExceededResponse(targetResult.retryAfterSeconds);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const channel = typeof body?.channel === "string" ? body.channel : "email";

    if (channel === "sms") {
      const parsedSms = forgotPasswordSmsSchema.safeParse(body);

      if (!parsedSms.success) {
        return NextResponse.json(
          {
            message: "Revisa los campos del formulario.",
            errors: parsedSms.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      const normalizedPhone = normalizePhoneNumber(parsedSms.data.phone, parsedSms.data.phoneCountry);
      if (!normalizedPhone) {
        return NextResponse.json(
          {
            message: "Revisa los campos del formulario.",
            errors: { phone: ["Ingresa un numero valido para el pais seleccionado."] },
          },
          { status: 400 },
        );
      }

      const rateLimitResponse = checkForgotPasswordRateLimit(request, "sms", normalizedPhone);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const user = await getUserByPhone(normalizedPhone);

      if (!user) {
        return NextResponse.json({
          message: "Si existe una cuenta con ese numero, enviaremos un codigo por SMS.",
        });
      }

      await deleteExpiredPasswordResetSmsCodes();
      await invalidatePasswordResetSmsCodesForUser(user.id);

      const code = createSmsCode();
      await createPasswordResetSmsCodeRecord({
        userId: user.id,
        phone: normalizedPhone,
        codeHash: hashToken(code),
        maxAttempts: RESET_SMS_MAX_ATTEMPTS,
        expiresAt: new Date(Date.now() + RESET_SMS_CODE_TTL_MS),
      });

      await sendPasswordResetSms({
        recipient: normalizedPhone,
        code,
      });

      return NextResponse.json({
        message: "Si existe una cuenta con ese numero, enviaremos un codigo por SMS.",
      });
    }

    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const rateLimitResponse = checkForgotPasswordRateLimit(request, "email", normalizedEmail);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json({
        message: "Si existe una cuenta con ese correo, enviaremos un enlace de recuperacion.",
      });
    }

    await deleteExpiredPasswordResetTokens();
    await invalidatePasswordResetTokensForUser(user.id);

    const token = createToken();
    await createPasswordResetTokenRecord({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildPasswordResetUrl(token),
    });

    return NextResponse.json({
      message: "Si existe una cuenta con ese correo, enviaremos un enlace de recuperacion.",
    });
  } catch (error) {
    console.error("forgot password error", error);

    return NextResponse.json(
      { message: "No pudimos procesar la recuperacion de cuenta." },
      { status: 500 },
    );
  }
}
