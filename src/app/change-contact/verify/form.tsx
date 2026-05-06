"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyContactChangeForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(token ? "" : "Token no valido o faltante.");
  const [field, setField] = useState<"email" | "phone" | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    fetch("/api/profile/change-contact/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data: { message?: string; field?: string }) => {
        if (cancelled) return;
        setMessage(data.message ?? "Operacion completada.");
        if (data.field === "email" || data.field === "phone") setField(data.field);
        setStatus("success");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("No se pudo verificar el enlace.");
      });

    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-xl text-center">
      {status === "loading" && (
        <>
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--ui-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--ui-muted)]">Verificando enlace...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.15)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--ui-accent)]" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-[var(--ui-text)]">Cambio confirmado</h1>
          <p className="mb-6 text-sm text-[var(--ui-muted)]">{message}</p>
          {field === "email" ? (
            <Link
              href="/login"
              className="inline-block w-full rounded-xl bg-[var(--ui-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)]"
            >
              Iniciar sesion
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-block w-full rounded-xl bg-[var(--ui-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)]"
            >
              Ir al panel
            </Link>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:rgb(var(--ui-glow-danger)/0.12)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--ui-danger)]" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-[var(--ui-text)]">Enlace invalido</h1>
          <p className="mb-6 text-sm text-[var(--ui-muted)]">{message}</p>
          <Link
            href="/dashboard"
            className="inline-block w-full rounded-xl border border-[color:var(--ui-border)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
          >
            Volver al panel
          </Link>
        </>
      )}
    </div>
  );
}
