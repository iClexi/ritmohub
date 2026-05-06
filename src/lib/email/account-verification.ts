import { sendEmail, getAppUrl, getFromAddress } from "./send-email";

export function buildAccountVerificationUrl(token: string) {
  const url = new URL("/api/auth/account-verification/verify-email", getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendAccountVerificationEmail(input: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  const from = getFromAddress();

  await sendEmail({
    from,
    to: input.to,
    subject: "Verifica tu cuenta de RitmoHub",
    text: [
      `Hola ${input.name || "artista"},`,
      "",
      "Para activar tu cuenta, confirma tu correo con este enlace:",
      input.verificationUrl,
      "",
      "Si no solicitaste esta cuenta, ignora este mensaje.",
    ].join("\n"),
    html: `<p>Hola <strong>${input.name || "artista"}</strong>,</p><p>Para activar tu cuenta de RitmoHub, confirma tu correo:</p><p><a href="${input.verificationUrl}">Verificar cuenta</a></p><p>Si no solicitaste esta cuenta, ignora este mensaje.</p>`,
  });
}
