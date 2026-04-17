"use client";

import { useState } from "react";

import { createCourseCheckoutSchema } from "@/lib/validations/workspace";

type Props = {
  courseId: string;
  provider: "stripe" | "paypal";
  label: string;
  className?: string;
  style?: React.CSSProperties;
};

export function CourseCheckoutButton({ courseId, provider, label, className, style }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    const parsed = createCourseCheckoutSchema.safeParse({ courseId, provider });
    if (!parsed.success) {
      setError("Solicitud de pago invalida.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.message ?? "Error al iniciar el checkout.");
      }

      // Redirigir al usuario al proveedor de pagos
      window.location.href = payload.checkoutUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar el checkout.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleCheckout}
        className={`${className} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        style={style}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
            Redirigiendo...
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-400 text-center">{error}</p>
      )}
    </>
  );
}
