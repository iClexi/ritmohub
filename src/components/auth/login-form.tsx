"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { loginSchema } from "@/lib/validations/auth";

type LoginFormValues = z.infer<typeof loginSchema>;

type ApiValidationErrors = Partial<Record<keyof LoginFormValues, string[]>>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const clearServerError = () => {
    if (serverError) {
      setServerError(null);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    const response = await fetch("/api/auth/login", {
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
        const formFields: Array<keyof LoginFormValues> = ["email", "password"];

        for (const field of formFields) {
          const fieldError = payload.errors[field]?.[0];

          if (fieldError) {
            setError(field, { message: fieldError });
          }
        }
      }

      setServerError(payload?.message ?? "No se pudo iniciar sesion.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-up space-y-5" noValidate>
      {serverError ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {serverError}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Correo</span>
        <input
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          {...register("email", { onChange: clearServerError })}
          className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
        />
        {errors.email?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.email.message}</p> : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Contrasena</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Tu contrasena"
            autoComplete="current-password"
            {...register("password", { onChange: clearServerError })}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 pr-16 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ui-primary)] transition hover:bg-[color:rgb(var(--ui-glow-primary)/0.14)]"
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-6 10-6c2.3 0 4.2.7 5.7 1.6" />
                <path d="M22 12s-3.5 6-10 6c-2.3 0-4.2-.7-5.7-1.6" />
                <path d="M4 4l16 16" />
              </svg>
            )}
          </button>
        </div>
        {errors.password?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.password.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rh-btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Entrando..." : "Iniciar sesion"}
      </button>

      <p className="text-sm text-[var(--ui-muted)]">
        No tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--ui-danger)] hover:underline">
          Registrate aqui
        </Link>
      </p>
    </form>
  );
}
