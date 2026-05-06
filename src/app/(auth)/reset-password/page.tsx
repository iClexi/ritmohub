import { createHash } from "node:crypto";

import Link from "next/link";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetPasswordSmsForm } from "@/components/auth/reset-password-sms-form";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getValidPasswordResetTokenByHash } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function ExpiredLinkScreen({ reason }: { reason: "missing" | "invalid" }) {
  const title = reason === "missing" ? "Enlace incompleto" : "Enlace vencido o ya usado";
  const description =
    reason === "missing"
      ? "El enlace que abriste no incluye un token de recuperacion valido. Solicita uno nuevo desde la pantalla de inicio de sesion."
      : "Tu enlace de recuperacion ya expiro o fue usado. Por seguridad, los enlaces de RitmoHub solo duran 15 minutos. Solicita uno nuevo y volvemos a la musica.";

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-8 py-12 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] text-[var(--ui-danger)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-semibold text-[var(--ui-text)]">{title}</h3>
          <p className="mx-auto max-w-md text-base text-[var(--ui-muted)]">{description}</p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rh-btn-primary inline-flex items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)]"
          >
            Volver al inicio
          </Link>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--ui-border)] px-5 py-3 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-surface-soft)]"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sms?: string; phone?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) {
    redirect("/dashboard");
  }

  const smsMode = params.sms?.trim() === "1";
  const smsPhone = normalizePhoneNumber(params.phone?.trim() ?? "");

  if (smsMode && smsPhone) {
    return (
      <div className="space-y-6">
        <BackButton fallbackHref="/forgot-password" />

        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[var(--ui-text)]">Verifica el codigo SMS</h2>
          <p className="text-sm text-[var(--ui-muted)]">
            Escribe el codigo que recibiste para autorizar el cambio de contrasena.
          </p>
        </header>

        <ResetPasswordSmsForm phone={smsPhone} />
      </div>
    );
  }

  const token = params.token?.trim() ?? "";

  if (!token) {
    return <ExpiredLinkScreen reason="missing" />;
  }

  let tokenRecord: Awaited<ReturnType<typeof getValidPasswordResetTokenByHash>> = null;
  try {
    tokenRecord = await getValidPasswordResetTokenByHash(hashToken(token));
  } catch (error) {
    console.error("reset-password page: token lookup failed", error);
    return <ExpiredLinkScreen reason="invalid" />;
  }

  if (!tokenRecord) {
    return <ExpiredLinkScreen reason="invalid" />;
  }

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/login" />

      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-[var(--ui-text)]">Crea una contrasena nueva</h2>
        <p className="text-sm text-[var(--ui-muted)]">
          Usa el enlace que recibiste por correo para proteger de nuevo tu cuenta. Este enlace expira en 15 minutos.
        </p>
      </header>

      <ResetPasswordForm token={token} />
    </div>
  );
}
