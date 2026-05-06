import { NextResponse } from "next/server";

import { hashAccountVerificationSecret } from "@/lib/auth/account-verification";
import { getSessionFromCookie } from "@/lib/auth/session";
import {
  getAccountVerificationByUserId,
  getValidAccountVerificationSmsCodeByUserId,
  incrementAccountVerificationSmsCodeAttempts,
  invalidateAccountVerificationEmailTokensForUser,
  markAccountVerificationAsVerified,
  markAccountVerificationSmsCodeConsumed,
} from "@/lib/auth/account-verification-store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { verifyAccountVerificationSmsSchema } from "@/lib/validations/auth";

const VERIFICATION_RATE_WINDOW_MS = 5 * 60 * 1000;

function checkVerifyRateLimit(request: Request, userId: string) {
  const ip = getClientIp(request);

  const ipResult = consumeRateLimit({
    key: createRateLimitKey("account-verify-check", "sms", "ip", ip),
    limit: 20,
    windowMs: VERIFICATION_RATE_WINDOW_MS,
    blockMs: VERIFICATION_RATE_WINDOW_MS,
  });

  if (!ipResult.allowed) {
    return rateLimitExceededResponse(ipResult.retryAfterSeconds);
  }

  const userResult = consumeRateLimit({
    key: createRateLimitKey("account-verify-check", "sms", "user", userId),
    limit: 10,
    windowMs: VERIFICATION_RATE_WINDOW_MS,
    blockMs: VERIFICATION_RATE_WINDOW_MS,
  });

  if (!userResult.allowed) {
    return rateLimitExceededResponse(userResult.retryAfterSeconds);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const sessionPayload = await getSessionFromCookie();

    if (!sessionPayload) {
      return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
    }

    const userId = sessionPayload.session.user.id;
    const verificationRecord = await getAccountVerificationByUserId(userId);

    if (!verificationRecord || verificationRecord.status === "verified") {
      return NextResponse.json({
        message: "Tu cuenta ya esta verificada.",
        verified: true,
      });
    }

    const body = await request.json();
    const parsed = verifyAccountVerificationSmsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa el codigo ingresado.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const rateLimitResponse = checkVerifyRateLimit(request, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const codeRecord = await getValidAccountVerificationSmsCodeByUserId(userId);

    if (!codeRecord) {
      return NextResponse.json(
        { message: "El codigo no es valido o ya expiro." },
        { status: 400 },
      );
    }

    if (hashAccountVerificationSecret(parsed.data.code) !== codeRecord.codeHash) {
      const attempts = await incrementAccountVerificationSmsCodeAttempts(codeRecord.id);
      const blocked = attempts >= codeRecord.maxAttempts;

      return NextResponse.json(
        {
          message: blocked
            ? "Ese codigo quedo bloqueado por demasiados intentos. Solicita uno nuevo."
            : "El codigo no es valido o ya expiro.",
        },
        { status: 400 },
      );
    }

    await markAccountVerificationSmsCodeConsumed(codeRecord.id);
    await invalidateAccountVerificationEmailTokensForUser(userId);
    await markAccountVerificationAsVerified(userId);

    return NextResponse.json({
      message: "Cuenta verificada correctamente.",
      verified: true,
    });
  } catch (error) {
    console.error("account verification sms error", error);

    return NextResponse.json(
      { message: "No pudimos verificar tu cuenta por SMS." },
      { status: 500 },
    );
  }
}
