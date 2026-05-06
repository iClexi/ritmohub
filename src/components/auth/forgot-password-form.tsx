"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { type CountryIso2, PhoneInput } from "react-international-phone";
import { z } from "zod";

import { forgotPasswordSchema, forgotPasswordSmsSchema } from "@/lib/validations/auth";

const DEFAULT_PHONE_COUNTRY: CountryIso2 = "do";
const phoneControlKeys = new Set(["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"]);

type RecoveryMethod = "email" | "sms";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ForgotPasswordSmsFormValues = z.infer<typeof forgotPasswordSmsSchema>;

type ApiValidationErrors = {
  email?: string[];
  phone?: string[];
  phoneCountry?: string[];
};

function preventNonNumericPhoneInput(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (phoneControlKeys.has(event.key)) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

function RecoveryMethodSelector({
  value,
  onChange,
}: {
  value: RecoveryMethod;
  onChange: (value: RecoveryMethod) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-1">
      <button
        type="button"
        onClick={() => onChange("email")}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
          value === "email"
            ? "bg-[var(--ui-primary)] text-[var(--ui-on-primary)]"
            : "text-[var(--ui-muted)] hover:bg-[var(--ui-surface)]"
        }`}
      >
        Recuperar por correo
      </button>
      <button
        type="button"
        onClick={() => onChange("sms")}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
          value === "sms"
            ? "bg-[var(--ui-primary)] text-[var(--ui-on-primary)]"
            : "text-[var(--ui-muted)] hover:bg-[var(--ui-surface)]"
        }`}
      >
        Recuperar por SMS
      </button>
    </div>
  );
}

function ForgotByEmailForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "email",
        ...values,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; errors?: ApiValidationErrors }
      | null;

    if (!response.ok) {
      const emailError = payload?.errors?.email?.[0];
      if (emailError) {
        setError("email", { message: emailError });
      }
      setError("root", { message: payload?.message ?? "No se pudo enviar el correo." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {errors.root?.message ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {errors.root.message}
        </div>
      ) : null}

      {isSubmitSuccessful ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-primary)/0.3)] bg-[color:rgb(var(--ui-glow-primary)/0.12)] px-4 py-3 text-sm text-[var(--ui-text)]">
          Si existe una cuenta con ese correo, te enviaremos un enlace para crear una contrasena nueva.
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Correo registrado</span>
        <input
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          {...register("email")}
          className="rh-input w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
        />
        {errors.email?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.email.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rh-btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Enviar enlace"}
      </button>
    </form>
  );
}

function ForgotBySmsForm() {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSmsFormValues>({
    resolver: zodResolver(forgotPasswordSmsSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      phone: "",
      phoneCountry: DEFAULT_PHONE_COUNTRY,
    },
  });

  const onSubmit = async (values: ForgotPasswordSmsFormValues) => {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "sms",
        ...values,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; errors?: ApiValidationErrors }
      | null;

    if (!response.ok) {
      const phoneError = payload?.errors?.phone?.[0];
      if (phoneError) {
        setError("phone", { message: phoneError });
      }
      setError("root", { message: payload?.message ?? "No se pudo enviar el SMS." });
      return;
    }

    router.push(`/reset-password?sms=1&phone=${encodeURIComponent(values.phone)}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {errors.root?.message ? (
        <div className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
          {errors.root.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <span className="text-sm font-semibold text-[var(--ui-text)]">Celular con codigo de pais</span>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              defaultCountry={DEFAULT_PHONE_COUNTRY}
              preferredCountries={["do", "us", "es", "mx", "co", "ar", "ve", "cl", "pe", "ec", "pa", "pr"]}
              forceDialCode
              value={field.value}
              onChange={(nextPhone, meta) => {
                field.onChange(nextPhone);
                setValue("phoneCountry", meta.country.iso2, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onBlur={field.onBlur}
              className="rh-phone-field"
              inputProps={{
                name: field.name,
                autoComplete: "tel",
                inputMode: "numeric",
                onKeyDown: preventNonNumericPhoneInput,
              }}
            />
          )}
        />
        <input type="hidden" {...register("phoneCountry")} />
        {errors.phone?.message ? <p className="text-sm text-[var(--ui-danger)]">{errors.phone.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rh-btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ui-primary)] px-5 py-3 font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Enviar codigo por SMS"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [method, setMethod] = useState<RecoveryMethod>("email");

  return (
    <div className="animate-fade-up space-y-5">
      <RecoveryMethodSelector value={method} onChange={setMethod} />

      {method === "email" ? <ForgotByEmailForm /> : <ForgotBySmsForm />}

      <p className="text-sm text-[var(--ui-muted)]">
        Recordaste tu contrasena?{" "}
        <Link href="/login" className="font-semibold text-[var(--ui-danger)] hover:underline">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
