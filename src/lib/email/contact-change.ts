import { sendEmail, getAppUrl, getFromAddress, escapeHtml } from "./send-email";

export function buildContactChangeUrl(token: string) {
  const url = new URL("/change-contact/verify", getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendContactChangeEmail(input: {
  to: string;
  name: string;
  field: "email" | "phone";
  newValue: string;
  confirmUrl: string;
}) {
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const logoUrl = `${appUrl}/brand/logo-email.png?v=4`;
  const safeName = escapeHtml(input.name || "artista");
  const safeUrl = escapeHtml(input.confirmUrl);
  const safeAppUrl = escapeHtml(appUrl);
  const safeLogoUrl = escapeHtml(logoUrl);
  const fieldLabel = input.field === "email" ? "correo electronico" : "numero de telefono";
  const safeNewValue = escapeHtml(input.newValue);
  const subject =
    input.field === "email"
      ? "Confirma tu nuevo correo en RitmoHub"
      : "Confirma tu nuevo telefono en RitmoHub";

  await sendEmail({
    from,
    to: input.to,
    subject,
    text: [
      `Hola ${input.name || "artista"},`,
      "",
      `Recibimos una solicitud para cambiar tu ${fieldLabel} en RitmoHub.`,
      `Nuevo valor: ${input.newValue}`,
      "",
      "Para confirmar el cambio, abre este enlace:",
      input.confirmUrl,
      "",
      "El enlace expira en 30 minutos. Si no solicitaste este cambio, ignora este correo.",
      "",
      "-- El equipo de RitmoHub",
      appUrl,
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirma tu cambio en RitmoHub</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f6f7eb;font-family:'Inter',system-ui,sans-serif;color:#27323a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7eb;padding:36px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 48px rgba(39,50,58,0.12);">
        <tr><td style="background:linear-gradient(135deg,#3f88c5 0%,#5fa3d4 45%,#44bba4 100%);padding:40px 32px 24px;text-align:center;">
          <img src="${safeLogoUrl}" alt="RitmoHub" width="72" height="72" style="display:block;margin:0 auto 14px;">
          <h1 style="margin:0 0 8px;font-size:28px;color:#fff;font-weight:800;">Confirma tu cambio</h1>
          <p style="margin:0;font-size:14px;color:#eaf4ff;">Verificacion de ${fieldLabel}</p>
        </td></tr>
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0 0 12px;font-size:17px;font-weight:600;">Hola, <span style="color:#3f88c5;">${safeName}</span></p>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#3a4651;">
            Solicitaste cambiar tu <strong>${fieldLabel}</strong> en <strong>RitmoHub</strong>.
          </p>
          <div style="margin:0 0 16px;padding:14px 18px;background:#f6f7eb;border-radius:12px;border-left:4px solid #3f88c5;">
            <p style="margin:0;font-size:12px;color:#5d6971;font-weight:600;">Nuevo ${fieldLabel}:</p>
            <p style="margin:4px 0 0;font-size:15px;color:#27323a;font-weight:700;">${safeNewValue}</p>
          </div>
        </td></tr>
        <tr><td align="center" style="padding:8px 40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#3f88c5;border-radius:14px;box-shadow:0 8px 20px rgba(63,136,197,0.35);">
              <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                Confirmar cambio
              </a>
            </td>
          </tr></table>
          <p style="margin:12px 0 0;font-size:12px;color:#5d6971;">Este enlace expira en <strong>30 minutos</strong>.</p>
        </td></tr>
        <tr><td style="padding:8px 40px 16px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#5d6971;">El boton no funciona? Copia este enlace:</p>
          <p style="margin:0;font-size:12px;color:#3f88c5;word-break:break-all;"><a href="${safeUrl}" style="color:#3f88c5;">${safeUrl}</a></p>
        </td></tr>
        <tr><td style="background:#27323a;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#fff;">RitmoHub</p>
          <p style="margin:0;font-size:11px;"><a href="${safeAppUrl}" style="color:#44bba4;text-decoration:none;">${safeAppUrl}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  });
}
