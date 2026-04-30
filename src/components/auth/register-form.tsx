"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { registerSchema, sanitizePersonNameInput, sanitizeUsernameInput } from "@/lib/validations/auth";

type RegisterFormValues = z.infer<typeof registerSchema>;

type ApiValidationErrors = Partial<Record<keyof RegisterFormValues, string[]>>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const removedUserReason = searchParams.get("reason") === "user-deleted";

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const clearServerError = () => {
    if (serverError) {
      setServerError(null);
    }
  };

  const handleNameChange = (
    field: "firstName" | "lastName",
    rawValue: string,
  ) => {
    setValue(field, sanitizePersonNameInput(rawValue), {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearServerError();
  };

  const handleUsernameChange = (rawValue: string) => {
    setValue("username", sanitizeUsernameInput(rawValue), {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearServerError();
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    const response = await fetch("/api/auth/register", {
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
        const formFields: Array<keyof RegisterFormValues> = [
          "firstName",
          "lastName",
          "username",
          "email",
          "password",
          "confirmPassword",
        ];

        for (const field of formFields) {
          const fieldError = payload.errors[field]?.[0];

          if (fieldError) {
            setError(field, { message: fieldError });
          }
        }
      }

      setServerError(payload?.message ?? "No se pudo crear la cuenta.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-up space-y-5" noValidate>
      {removedUserReason ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          Tu usuario fue eliminado.
        </div>
      ) : null}

      {serverError ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--ui-text)]">Nombre</span>
          <input
            type="text"
            placeholder="Ej: Laura"
            autoComplete="given-name"
            {...register("firstName", {
              onChange: (event) => handleNameChange("firstName", event.target.value),
            })}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          {errors.firstName?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.firstName.message}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--ui-text)]">Apellido</span>
          <input
            type="text"
            placeholder="Ej: Perez"
            autoComplete="family-name"
            {...register("lastName", {
              onChange: (event) => handleNameChange("lastName", event.target.value),
            })}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          {errors.lastName?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.lastName.message}</p> : null}
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Username</span>
        <input
          type="text"
          placeholder="Ej: laura_perez"
          autoComplete="username"
          {...register("username", {
            onChange: (event) => handleUsernameChange(event.target.value),
          })}
          className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
        />
        {errors.username?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.username.message}</p> : null}
      </label>

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
            type={showPasswords ? "text" : "password"}
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
            {...register("password", { onChange: clearServerError })}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 pr-16 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ui-primary)] transition hover:bg-[color:rgb(var(--ui-glow-primary)/0.14)]"
            aria-label={showPasswords ? "Ocultar contrasenas" : "Mostrar contrasenas"}
          >
            {showPasswords ? (
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

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Confirmar contrasena</span>
        <div className="relative">
          <input
            type={showPasswords ? "text" : "password"}
            placeholder="Repite tu contrasena"
            autoComplete="new-password"
            {...register("confirmPassword", { onChange: clearServerError })}
            className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 pr-16 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
          />
          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ui-primary)] transition hover:bg-[color:rgb(var(--ui-glow-primary)/0.14)]"
            aria-label={showPasswords ? "Ocultar contrasenas" : "Mostrar contrasenas"}
          >
            {showPasswords ? (
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
        {errors.confirmPassword?.message ? (
          <p className="text-sm text-[var(--ui-danger)]">{errors.confirmPassword.message}</p>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rh-btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ui-danger)] px-5 py-3 font-semibold text-[var(--ui-on-danger)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-sm text-[var(--ui-muted)]">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--ui-primary)] hover:underline">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
