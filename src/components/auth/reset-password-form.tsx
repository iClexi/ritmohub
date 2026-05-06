"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resetPasswordSchema } from "@/lib/validations/auth";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type ApiValidationErrors = Partial<Record<keyof ResetPasswordFormValues, string[]>>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSuccessMessage(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; errors?: ApiValidationErrors }
      | null;

    if (!response.ok) {
      if (payload?.errors) {
        for (const field of ["token", "password", "confirmPassword"] as const) {
          const fieldError = payload.errors[field]?.[0];
          if (fieldError) {
            setError(field, { message: fieldError });
          }
        }
      }
      setError("root", { message: payload?.message ?? "No se pudo actualizar la contraseña." });
      return;
    }

    setSuccessMessage(payload?.message ?? "Contraseña actualizada correctamente.");
    setTimeout(() => router.push("/login"), 1200);
  };

  const eyeOpen = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const eyeOff = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6c2.3 0 4.2.7 5.7 1.6" />
      <path d="M22 12s-3.5 6-10 6c-2.3 0-4.2-.7-5.7-1.6" />
      <path d="M4 4l16 16" />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-up space-y-5" noValidate>
      <input type="hidden" {...register("token")} />

      {errors.root?.message ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {errors.root.message}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-primary)/0.3)] bg-[color:rgb(var(--ui-glow-primary)/0.12)] px-4 py-3 text-sm text-[var(--ui-text)]">
          {successMessage}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Nueva contraseña</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            {...register("password")}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 pr-16 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ui-primary)] transition hover:bg-[color:rgb(var(--ui-glow-primary)/0.14)]"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? eyeOpen : eyeOff}
          </button>
        </div>
        {errors.password?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.password.message}</p> : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Confirmar contraseña</span>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 pr-16 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ui-primary)] transition hover:bg-[color:rgb(var(--ui-glow-primary)/0.14)]"
            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirmPassword ? eyeOpen : eyeOff}
          </button>
        </div>
        {errors.confirmPassword?.message ? (
          <p className="text-sm text-[var(--ui-danger)]">{errors.confirmPassword.message}</p>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting || !token}
        className="rh-btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
      </button>

      <p className="text-sm text-[var(--ui-muted)]">
        ¿Ya tienes acceso?{" "}
        <Link href="/login" className="font-semibold text-[var(--ui-danger)] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
