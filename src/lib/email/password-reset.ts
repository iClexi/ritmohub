import { sendEmail, getAppUrl, getFromAddress, escapeHtml } from "./send-email";

export function buildPasswordResetUrl(token: string) {
  const url = new URL("/reset-password", getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const logoUrl = `${appUrl}/brand/logo-email.png?v=4`;
  const lockUrl = `${appUrl}/brand/lock-badge.png?v=1`;
  const displayName = input.name || "artista";
  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(input.resetUrl);
  const safeAppUrl = escapeHtml(appUrl);
  const safeLogoUrl = escapeHtml(logoUrl);
  const safeLockUrl = escapeHtml(lockUrl);

  await sendEmail({
    from,
    to: input.to,
    subject: "🎵 Restablece tu contraseña en RitmoHub",
    text: [
      `Hola ${displayName},`,
      "",
      "Recibimos una solicitud para restablecer la contraseña de tu cuenta de RitmoHub.",
      "",
      `Abre este enlace para crear una contraseña nueva:`,
      input.resetUrl,
      "",
      "El enlace expira en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá igual.",
      "",
      "— El equipo de RitmoHub",
      "La red musical donde tus conexiones se convierten en conciertos.",
      appUrl,
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Restablece tu contraseña en RitmoHub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f6f7eb;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#27323a;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Recupera el acceso a tu cuenta de RitmoHub. El enlace expira en 15 minutos.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7eb;background-image:radial-gradient(circle at 20% 0%,rgba(63,136,197,0.08) 0%,transparent 45%),radial-gradient(circle at 90% 100%,rgba(68,187,164,0.08) 0%,transparent 45%);padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 48px rgba(39,50,58,0.12),0 2px 8px rgba(39,50,58,0.06);">
          <!-- HEADER -->
          <tr>
            <td style="background:#3f88c5;background-image:linear-gradient(135deg,#3f88c5 0%,#5fa3d4 45%,#44bba4 100%);padding:44px 32px 24px;text-align:center;position:relative;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 22px;">
                <tr>
                  <td align="center" style="padding:6px 14px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.28);border-radius:999px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#ffffff;text-transform:uppercase;">
                    Seguridad de la cuenta
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px;">
                <tr>
                  <td align="center">
                    <img src="${safeLogoUrl}" alt="RitmoHub" width="84" height="84" style="display:block;border:0;outline:none;text-decoration:none;width:84px;height:auto;">
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:34px;line-height:1.15;color:#ffffff;font-weight:800;letter-spacing:-0.6px;">
                Recupera tu acceso
              </h1>
              <p style="margin:0;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:15px;font-weight:500;color:#eaf4ff;opacity:0.94;">
                Volvamos al ritmo en menos de un minuto.
              </p>
            </td>
          </tr>

          <!-- WAVE SEPARATOR -->
          <tr>
            <td style="padding:0;line-height:0;font-size:0;background:#ffffff;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 40" preserveAspectRatio="none" width="100%" height="40" style="display:block;">
                <path d="M0,40 L0,18 C100,40 200,0 300,18 C400,36 500,4 600,22 L600,40 Z" fill="#44bba4" opacity="0.10"/>
                <path d="M0,40 L0,24 C100,46 200,6 300,24 C400,42 500,10 600,28 L600,40 Z" fill="#3f88c5" opacity="0.12"/>
                <path d="M0,40 L0,30 C150,50 300,12 450,30 C525,39 562,35 600,32 L600,40 Z" fill="#ffffff"/>
              </svg>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:14px 40px 4px;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
              <p style="margin:0 0 8px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:18px;font-weight:600;color:#27323a;letter-spacing:-0.2px;">
                Hola, <span style="color:#3f88c5;font-weight:700;">${safeName}</span> 👋
              </p>
              <p style="margin:0 0 4px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.65;font-weight:400;color:#3a4651;">
                Alguien (esperamos que tú) pidió restablecer la contraseña de tu cuenta de <strong style="color:#27323a;font-weight:700;">RitmoHub</strong>. Solo necesitas un clic para volver al estudio.
              </p>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td align="center" style="padding:28px 40px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background:#3f88c5;background-image:linear-gradient(135deg,#3f88c5 0%,#3a78b3 100%);border-radius:16px;box-shadow:0 10px 24px rgba(63,136,197,0.38),0 2px 4px rgba(63,136,197,0.2);">
                    <a href="${safeUrl}" target="_blank"
                       style="display:inline-block;padding:18px 44px;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Crear nueva contraseña →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:500;color:#5d6971;">
                <span style="display:inline-block;vertical-align:middle;width:14px;height:14px;background:#fef3c7;border:1px solid #fbbf24;border-radius:50%;line-height:13px;font-size:9px;color:#92400e;font-weight:800;text-align:center;margin-right:6px;">!</span>
                Este enlace expira en <strong style="font-weight:700;color:#27323a;">15 minutos</strong>.
              </p>
            </td>
          </tr>

          <!-- 3 STEPS -->
          <tr>
            <td style="padding:28px 40px 12px;">
              <div style="background:#f6f7eb;border-radius:16px;padding:20px 22px;">
                <p style="margin:0 0 14px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;color:#5d6971;text-transform:uppercase;">
                  Cómo funciona
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="top" style="padding:0 0 12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td valign="top" style="padding-right:14px;">
                            <div style="width:32px;height:32px;line-height:32px;text-align:center;background:#3f88c5;border-radius:50%;font-family:'Inter',sans-serif;font-size:14px;font-weight:800;color:#ffffff;">1</div>
                          </td>
                          <td valign="middle" style="font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:14px;font-weight:500;line-height:1.5;color:#27323a;">
                            Toca el botón <strong style="font-weight:700;">Crear nueva contraseña</strong>.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" style="padding:0 0 12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td valign="top" style="padding-right:14px;">
                            <div style="width:32px;height:32px;line-height:32px;text-align:center;background:#44bba4;border-radius:50%;font-family:'Inter',sans-serif;font-size:14px;font-weight:800;color:#ffffff;">2</div>
                          </td>
                          <td valign="middle" style="font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:14px;font-weight:500;line-height:1.5;color:#27323a;">
                            Elige una contraseña <strong style="font-weight:700;">segura y nueva</strong>.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td valign="top" style="padding-right:14px;">
                            <div style="width:32px;height:32px;line-height:32px;text-align:center;background:#27323a;border-radius:50%;font-family:'Inter',sans-serif;font-size:14px;font-weight:800;color:#ffffff;">3</div>
                          </td>
                          <td valign="middle" style="font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:14px;font-weight:500;line-height:1.5;color:#27323a;">
                            Vuelve a sonar fuerte en <strong style="font-weight:700;color:#3f88c5;">RitmoHub</strong>.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- FALLBACK LINK -->
          <tr>
            <td style="padding:8px 40px 4px;font-family:'Inter',system-ui,-apple-system,sans-serif;">
              <p style="margin:0 0 6px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;color:#5d6971;letter-spacing:0.2px;">
                ¿El botón no funciona? Copia este enlace:
              </p>
              <p style="margin:0;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:400;line-height:1.5;color:#3f88c5;word-break:break-all;">
                <a href="${safeUrl}" target="_blank" style="color:#3f88c5;text-decoration:underline;">${safeUrl}</a>
              </p>
            </td>
          </tr>

          <!-- SECURITY NOTICE -->
          <tr>
            <td style="padding:24px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2e8;border-radius:14px;border:1px solid rgba(68,187,164,0.25);">
                <tr>
                  <td width="56" valign="middle" align="center" style="padding:16px 0 16px 18px;">
                    <img src="${safeLockUrl}" alt="" width="42" height="42" style="display:block;border:0;outline:none;text-decoration:none;width:42px;height:42px;">
                  </td>
                  <td valign="middle" style="padding:16px 18px 16px 14px;font-family:'Inter',system-ui,-apple-system,sans-serif;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#27323a;">¿No fuiste tú?</p>
                    <p style="margin:0;font-size:13px;font-weight:400;line-height:1.55;color:#3a4651;">
                      Ignora este correo. Tu contraseña actual sigue funcionando y nadie puede entrar a tu cuenta.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent 0%,rgba(57,62,65,0.18) 50%,transparent 100%);"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#27323a;background-image:linear-gradient(135deg,#27323a 0%,#1f2932 100%);padding:32px 40px;text-align:center;font-family:'Inter',system-ui,-apple-system,sans-serif;">
              <img src="${safeLogoUrl}" alt="RitmoHub" width="44" height="44" style="display:block;margin:0 auto 12px;border:0;outline:none;text-decoration:none;width:44px;height:auto;opacity:0.92;">
              <p style="margin:0 0 6px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:14px;font-weight:800;color:#ffffff;letter-spacing:0.4px;">
                RitmoHub
              </p>
              <p style="margin:0 0 14px;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:400;line-height:1.55;color:#a8b2c7;">
                La red musical donde tus conexiones se convierten en conciertos.
              </p>
              <p style="margin:0;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:500;color:#a8b2c7;">
                <a href="${safeAppUrl}" target="_blank" style="color:#44bba4;text-decoration:none;font-weight:600;">${safeAppUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:400;color:#5d6971;">
          Este correo se envió porque alguien solicitó restablecer la contraseña de esta cuenta.
        </p>
        <p style="margin:6px 0 0;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:10px;font-weight:400;color:#94a0aa;">
          © RitmoHub · iclexi.tech
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
