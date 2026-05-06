import nodemailer from "nodemailer";

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function boolEnv(name: string, fallback = false): boolean {
  const value = envValue(name);
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "RitmoHub", email: from.trim() };
}

async function sendViaBrevo(payload: EmailPayload, apiKey: string) {
  const sender = parseFrom(payload.from);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
  if (!response.ok) {
    throw new Error(result?.message ?? result?.code ?? "Brevo rechazo el envio del correo.");
  }
}

async function sendViaSmtp(payload: EmailPayload) {
  const host = envValue("SMTP_HOST");
  if (!host) throw new Error("SMTP_HOST no esta configurado.");
  const port = Number(envValue("SMTP_PORT") ?? "25");
  const user = envValue("SMTP_USER");
  const pass = envValue("SMTP_PASSWORD");
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: boolEnv("SMTP_SECURE", false),
    requireTLS: boolEnv("SMTP_REQUIRE_TLS", false),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: user && pass ? { user, pass } : undefined,
  });
  await transport.sendMail({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export async function sendEmail(payload: EmailPayload) {
  const brevoKey = envValue("BREVO_API_KEY");
  if (brevoKey) {
    await sendViaBrevo(payload, brevoKey);
  } else {
    await sendViaSmtp(payload);
  }
}

export function getAppUrl() {
  return (
    envValue("NEXT_PUBLIC_APP_URL") ??
    "http://localhost:5155"
  ).replace(/\/+$/, "");
}

export function getFromAddress() {
  return envValue("SMTP_FROM") ?? "RitmoHub <no-reply@iclexi.tech>";
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
