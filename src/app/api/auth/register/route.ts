import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db";
import { normalizePersonName, normalizeUsername, registerSchema } from "@/lib/validations/auth";

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

    const { firstName, lastName, username, email, password } = parsed.data;
    const normalizedFirstName = normalizePersonName(firstName);
    const normalizedLastName = normalizePersonName(lastName);
    const normalizedUsername = normalizeUsername(username);
    const normalizedName = `${normalizedFirstName} ${normalizedLastName}`.replace(/\s+/g, " ").trim();
    const normalizedEmail = email.trim().toLowerCase();

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

    const passwordHash = await hashPassword(password);

    const user = await createUser({
      name: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      message: "Cuenta creada correctamente.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("register error", error);

    if (isPgUniqueViolation(error)) {
      return NextResponse.json(
        {
          message: "El username o el correo ya estan en uso.",
          errors: {
            username: ["Este username ya esta en uso."],
            email: ["Este correo ya esta en uso."],
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
