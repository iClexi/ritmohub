import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

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

    return NextResponse.json({
      message: "Sesion iniciada.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("login error", error);

    return NextResponse.json(
      { message: "No pudimos iniciar sesion." },
      { status: 500 },
    );
  }
}
