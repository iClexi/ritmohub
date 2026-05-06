function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getSmsSender() {
  const rawSender = envValue("BREVO_SMS_SENDER") ?? "RitmoHub";
  const normalized = rawSender.replaceAll(/[^A-Za-z0-9 ]/g, "").trim();
  return normalized.slice(0, 11) || "RitmoHub";
}

function getBrevoApiKey() {
  const key = envValue("BREVO_API_KEY");
  if (!key) {
    throw new Error("BREVO_API_KEY no esta configurado.");
  }

  return key;
}

export async function sendAccountVerificationSms(input: {
  recipient: string;
  code: string;
}) {
  const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": getBrevoApiKey(),
    },
    body: JSON.stringify({
      sender: getSmsSender(),
      recipient: input.recipient,
      type: "transactional",
      content: `RitmoHub: tu codigo de verificacion es ${input.code}. Expira en 10 minutos.`,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.code ?? "Brevo SMS rechazo la solicitud.");
  }
}
