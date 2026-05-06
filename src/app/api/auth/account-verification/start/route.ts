import { NextResponse } from "next/server";

import { sendAccountVerificationChallenge } from "@/lib/auth/account-verification";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getAccountVerificationByUserId } from "@/lib/auth/account-verification-store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { accountVerificationStartSchema } from "@/lib/validations/auth";

const VERIFICATION_RATE_WINDOW_MS = 5 * 60 * 1000;

function checkStartRateLimit(request: Request, userId: string, channel: "email" | "sms") {
  const ip = getClientIp(request);

  const ipResult = consumeRateLimit({
    key: createRateLimitKey("account-verify", channel, "ip", ip),
    limit: 5,
    windowMs: VERIFICATION_RATE_WINDOW_MS,
    blockMs: VERIFICATION_RATE_WINDOW_MS,
  });

  if (!ipResult.allowed) {
    return rateLimitExceededResponse(ipResult.retryAfterSeconds);
  }

  const userResult = consumeRateLimit({
    key: createRateLimitKey("account-verify", channel, "user", userId),
    limit: 1,
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

    const body = await request.json();
    const parsed = accountVerificationStartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Selecciona un metodo de verificacion valido.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const userId = sessionPayload.session.user.id;
    const verificationRecord = await getAccountVerificationByUserId(userId);

    if (!verificationRecord) {
      return NextResponse.json({
        message: "Tu cuenta ya esta habilitada.",
        verified: true,
      });
    }

    if (verificationRecord.status === "verified") {
      return NextResponse.json({
        message: "Tu cuenta ya esta verificada.",
        verified: true,
      });
    }

    const rateLimitResponse = checkStartRateLimit(request, userId, parsed.data.channel);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await sendAccountVerificationChallenge({
      userId,
      name: sessionPayload.session.user.name,
      channel: parsed.data.channel,
    });

    return NextResponse.json({
      message:
        parsed.data.channel === "sms"
          ? "Te enviamos un codigo por SMS."
          : "Te enviamos un enlace de verificacion al correo.",
      channel: parsed.data.channel,
    });
  } catch (error) {
    console.error("account verification start error", error);

    return NextResponse.json(
      { message: "No pudimos enviar la verificacion de cuenta." },
      { status: 500 },
    );
  }
}
