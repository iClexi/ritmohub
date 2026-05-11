import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createRateLimitKey, rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { loginSchema } from "@/lib/validations/auth";
import { extractClientIp, recordServerVisit, recordSiteVisit } from "@/lib/visit-tracking";

const LOGIN_IP_LIMIT = 20;
const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_EMAIL_LIMIT = 8;
const LOGIN_EMAIL_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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
    const ipForLimit = getClientIp(request);

    const ipResult = consumeRateLimit({
      key: createRateLimitKey("login", "form", "ip", ipForLimit),
      limit: LOGIN_IP_LIMIT,
      windowMs: LOGIN_IP_WINDOW_MS,
      blockMs: LOGIN_BLOCK_MS,
    });
    if (!ipResult.allowed) return rateLimitExceededResponse(ipResult.retryAfterSeconds);

    const emailResult = consumeRateLimit({
      key: createRateLimitKey("login", "form", "email", normalizedEmail),
      limit: LOGIN_EMAIL_LIMIT,
      windowMs: LOGIN_EMAIL_WINDOW_MS,
      blockMs: LOGIN_BLOCK_MS,
    });
    if (!emailResult.allowed) return rateLimitExceededResponse(emailResult.retryAfterSeconds);

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        {
          message: "Correo o contrasena invalida.",
          errors: { email: ["Verifica tus credenciales."] },
        },
        { status: 401 },
      );
    }

    const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!passwordOk) {
      return NextResponse.json(
        {
          message: "Correo o contrasena invalida.",
          errors: { password: ["Verifica tus credenciales."] },
        },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    const ip = extractClientIp(request.headers);
    const userAgent = request.headers.get("user-agent");
    const referrer = request.headers.get("referer");
    const visitId = await recordServerVisit({
      userId: user.id,
      source: "login",
      ip,
      userAgent,
      referrer,
    });
    await recordSiteVisit({
      userId: user.id,
      source: "login",
      ip,
      userAgent,
      payload: { pagePath: "/login", referrer },
    });

    return NextResponse.json({
      message: "Sesion iniciada.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      visitId,
    });
  } catch (error) {
    console.error("login error", error);

    return NextResponse.json(
      { message: "No pudimos iniciar sesion." },
      { status: 500 },
    );
  }
}
