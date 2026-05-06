"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Channel = "email" | "sms";
type Step = "choose" | "email-sent" | "sms-code";

export function VerifyAccountForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<Channel | null>(null);
  const [verifying, setVerifying] = useState(false);

  const start = async (channel: Channel) => {
    setSending(channel);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/account-verification/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(payload?.message ?? "No pudimos enviar la verificacion.");
        return;
      }

      if (channel === "email") {
        setStep("email-sent");
        setMessage("Te enviamos un enlace de verificacion al correo.");
      } else {
        setStep("sms-code");
        setMessage("Te enviamos un codigo SMS a tu celular.");
      }
    } finally {
      setSending(null);
    }
  };

  const verifySmsCode = async () => {
    setVerifying(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/account-verification/verify-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string; verified?: boolean } | null;

      if (!response.ok) {
        setError(payload?.message ?? "No pudimos verificar el codigo.");
        return;
      }

      if (payload?.verified) {
        router.push("/dashboard?verified=1");
        router.refresh();
        return;
      }

      setMessage(payload?.message ?? "Cuenta verificada correctamente.");
    } finally {
      setVerifying(false);
    }
  };

  const back = () => {
    setStep("choose");
    setCode("");
    setError(null);
    setMessage(null);
  };

  return (
    <div className="space-y-5">
      {step === "choose" ? (
        <>
          <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
            <p className="text-sm text-[var(--ui-muted)]">
              Elige como quieres activar tu cuenta. Mientras tanto algunas funciones estan limitadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => start("email")}
            disabled={sending !== null}
            className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4 text-left transition hover:border-[var(--ui-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:rgb(var(--ui-glow-primary)/0.18)] text-[var(--ui-primary)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-[var(--ui-text)]">
                {sending === "email" ? "Enviando..." : "Verificar por correo"}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--ui-muted)]">
                Te enviaremos un enlace para activar la cuenta.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => start("sms")}
            disabled={sending !== null}
            className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4 text-left transition hover:border-[var(--ui-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:rgb(var(--ui-glow-primary)/0.18)] text-[var(--ui-primary)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-[var(--ui-text)]">
                {sending === "sms" ? "Enviando..." : "Verificar por SMS"}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--ui-muted)]">
                Te enviaremos un codigo de 6 digitos al celular.
              </span>
            </span>
          </button>
        </>
      ) : null}

      {step === "sms-code" ? (
        <div className="space-y-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[var(--ui-text)]">Codigo recibido por SMS</span>
            <button
              type="button"
              onClick={() => start("sms")}
              disabled={sending === "sms"}
              className="text-xs font-semibold text-[var(--ui-primary)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending === "sms" ? "Reenviando..." : "Reenviar"}
            </button>
          </div>

          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.replaceAll(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-center text-2xl tracking-[0.4em] text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />

          <button
            type="button"
            onClick={verifySmsCode}
            disabled={verifying || code.length !== 6}
            className="rh-btn-primary flex w-full items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? "Verificando..." : "Verificar codigo"}
          </button>

          <button
            type="button"
            onClick={back}
            className="block w-full text-center text-xs font-semibold text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
          >
            Cambiar metodo
          </button>
        </div>
      ) : null}

      {step === "email-sent" ? (
        <div className="space-y-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
          <p className="text-sm text-[var(--ui-text)]">
            Revisa tu correo y haz click en el enlace que te enviamos para activar tu cuenta.
          </p>
          <button
            type="button"
            onClick={() => start("email")}
            disabled={sending === "email"}
            className="text-xs font-semibold text-[var(--ui-primary)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending === "email" ? "Reenviando..." : "Reenviar correo"}
          </button>
          <button
            type="button"
            onClick={back}
            className="block w-full text-center text-xs font-semibold text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
          >
            Cambiar metodo
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-primary)/0.35)] bg-[color:rgb(var(--ui-glow-primary)/0.12)] px-4 py-3 text-sm text-[var(--ui-text)]">
          {message}
        </div>
      ) : null}
    </div>
  );
}
