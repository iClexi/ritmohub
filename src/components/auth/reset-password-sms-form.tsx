"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { verifyPasswordResetSmsSchema } from "@/lib/validations/auth";

import { ResetPasswordForm } from "./reset-password-form";

type VerifySmsValues = z.infer<typeof verifyPasswordResetSmsSchema>;
type ApiValidationErrors = Partial<Record<keyof VerifySmsValues, string[]>>;

export function ResetPasswordSmsForm({ phone }: { phone: string }) {
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifySmsValues>({
    resolver: zodResolver(verifyPasswordResetSmsSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      phone,
      code: "",
    },
  });

  const onSubmit = async (values: VerifySmsValues) => {
    const response = await fetch("/api/auth/reset-password-sms/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; token?: string; errors?: ApiValidationErrors }
      | null;

    if (!response.ok) {
      if (payload?.errors) {
        for (const field of ["phone", "code"] as const) {
          const fieldError = payload.errors[field]?.[0];
          if (fieldError) {
            setError(field, { message: fieldError });
          }
        }
      }

      setError("root", { message: payload?.message ?? "No pudimos verificar el codigo SMS." });
      return;
    }

    if (!payload?.token) {
      setError("root", { message: "No recibimos el token de recuperacion. Intenta de nuevo." });
      return;
    }

    setVerifiedToken(payload.token);
  };

  if (verifiedToken) {
    return <ResetPasswordForm token={verifiedToken} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-up space-y-5" noValidate>
      <input type="hidden" {...register("phone")} />

      {errors.root?.message ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {errors.root.message}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Celular</span>
        <input
          type="text"
          value={phone}
          readOnly
          className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-muted)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Codigo SMS</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          {...register("code")}
          className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
        />
        {errors.code?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.code.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rh-btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Verificando..." : "Verificar codigo"}
      </button>

      <p className="text-sm text-[var(--ui-muted)]">
        No recibiste el codigo?{" "}
        <Link href="/forgot-password" className="font-semibold text-[var(--ui-danger)] hover:underline">
          Solicita otro
        </Link>
      </p>
    </form>
  );
}
