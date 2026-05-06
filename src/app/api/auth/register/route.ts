import { NextResponse } from "next/server";

import { createPendingAccountVerification } from "@/lib/auth/account-verification-store";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createUser, getUserByEmail, getUserByPhone, getUserByUsername } from "@/lib/db";
import { normalizePersonName, normalizePhoneNumber, normalizeUsername, registerSchema } from "@/lib/validations/auth";
import { extractClientIp, recordServerVisit, recordSiteVisit } from "@/lib/visit-tracking";

function isPgUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && (error as { code?: string }).code === "23505";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { firstName, lastName, username, email, password, phone, phoneCountry } = parsed.data;
    const normalizedFirstName = normalizePersonName(firstName);
    const normalizedLastName = normalizePersonName(lastName);
    const normalizedUsername = normalizeUsername(username);
    const normalizedName = `${normalizedFirstName} ${normalizedLastName}`.replaceAll(/\s+/g, " ").trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(phone, phoneCountry);

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          message: "Revisa los campos del formulario.",
          errors: { phone: ["Ingresa un numero valido para el pais seleccionado."] },
        },
        { status: 400 },
      );
    }

    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Ya existe una cuenta registrada con ese correo.",
          errors: { email: ["Este correo ya esta en uso."] },
        },
        { status: 409 },
      );
    }

    const existingUserWithSameUsername = await getUserByUsername(normalizedUsername);

    if (existingUserWithSameUsername) {
      return NextResponse.json(
        {
          message: "Ya existe una cuenta registrada con ese username.",
          errors: {
            username: ["Este username ya esta en uso."],
          },
        },
        { status: 409 },
      );
    }

    const existingUserWithSamePhone = await getUserByPhone(normalizedPhone);

    if (existingUserWithSamePhone) {
      return NextResponse.json(
        {
          message: "Ya existe una cuenta registrada con ese celular.",
          errors: {
            phone: ["Este celular ya esta en uso."],
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await createUser({
      name: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
    });

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    await createPendingAccountVerification({
      userId: user.id,
      email: user.email,
      phone: normalizedPhone,
    });

    const ip = extractClientIp(request.headers);
    const userAgent = request.headers.get("user-agent");
    const referrer = request.headers.get("referer");
    const visitId = await recordServerVisit({
      userId: user.id,
      source: "register",
      ip,
      userAgent,
      referrer,
    });
    await recordSiteVisit({
      userId: user.id,
      source: "register",
      ip,
      userAgent,
      payload: { pagePath: "/register", referrer },
    });

    return NextResponse.json({
      message: "Cuenta creada. Elige cómo verificarla.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      requiresVerification: true,
      visitId,
    });
  } catch (error) {
    console.error("register error", error);

    if (isPgUniqueViolation(error)) {
      return NextResponse.json(
        {
          message: "El username, correo o celular ya estan en uso.",
          errors: {
            username: ["Este username ya esta en uso."],
            email: ["Este correo ya esta en uso."],
            phone: ["Este celular ya esta en uso."],
          },
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "No pudimos completar el registro." },
      { status: 500 },
    );
  }
}
