"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { confirmCourseCheckoutSchema } from "@/lib/validations/workspace";

type PaymentPopupState = {
  kind: "loading" | "success" | "warning" | "error";
  title: string;
  message: string;
};

export function PaymentConfirmHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [popup, setPopup] = useState<PaymentPopupState | null>(null);

  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    if (!paymentResult) {
      return;
    }

    const provider = searchParams.get("provider");
    const purchaseId = searchParams.get("purchase_id");
    const sessionId = searchParams.get("session_id");
    const normalizedProvider = provider === "paypal" ? "paypal" : "stripe";

    const clearPaymentQuery = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("payment");
      params.delete("provider");
      params.delete("purchase_id");
      params.delete("session_id");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    if (paymentResult === "cancel") {
      setPopup({
        kind: "warning",
        title: "Pago cancelado",
        message: "El proceso de pago fue cancelado. Puedes intentarlo nuevamente cuando quieras.",
      });
      clearPaymentQuery();
      return;
    }

    if (paymentResult !== "success" || !purchaseId) {
      clearPaymentQuery();
      return;
    }

    let isMounted = true;

    const confirmCoursePayment = async () => {
      try {
        setPopup({
          kind: "loading",
          title: "Confirmando pago",
          message: "Estamos validando tu compra para desbloquear el curso.",
        });

        const parsed = confirmCourseCheckoutSchema.safeParse({
          purchaseId,
          provider: normalizedProvider,
          sessionId: normalizedProvider === "stripe" ? sessionId : undefined,
        });

        if (!parsed.success) {
          throw new Error("Parametros de confirmacion invalidos.");
        }

        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        });

        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "Error al confirmar el pago.");
        }

        if (!isMounted) {
          return;
        }

        setPopup({
          kind: "success",
          title: "Pago confirmado",
          message: payload?.message ?? "Tu curso ya esta desbloqueado.",
        });
        clearPaymentQuery();
        router.refresh();
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        const message = err instanceof Error ? err.message : "No se pudo confirmar el pago de tu curso.";
        setPopup({
          kind: "error",
          title: "No pudimos confirmar el pago",
          message,
        });
        clearPaymentQuery();
      }
    };

    void confirmCoursePayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, pathname]);

  const canClosePopup = popup?.kind !== "loading";

  if (!popup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar mensaje"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => {
          if (canClosePopup) {
            setPopup(null);
          }
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-3xl border p-6 shadow-2xl"
        style={{
          background: "var(--ui-surface)",
          borderColor: "var(--ui-border)",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background:
                popup.kind === "success"
                  ? "rgba(16,185,129,0.2)"
                  : popup.kind === "error"
                    ? "rgba(239,68,68,0.2)"
                    : popup.kind === "warning"
                      ? "rgba(245,158,11,0.2)"
                      : "rgba(99,102,241,0.2)",
              color:
                popup.kind === "success"
                  ? "#10b981"
                  : popup.kind === "error"
                    ? "#ef4444"
                    : popup.kind === "warning"
                      ? "#f59e0b"
                      : "#818cf8",
            }}
          >
            {popup.kind === "loading" ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V1C6.48 1 2 5.48 2 11h2z" className="opacity-90" />
              </svg>
            ) : popup.kind === "success" ? (
              "✓"
            ) : popup.kind === "error" ? (
              "!"
            ) : (
              "i"
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold" style={{ color: "var(--ui-text)" }}>
              {popup.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>
              {popup.message}
            </p>
          </div>
        </div>

        {canClosePopup && (
          <button
            type="button"
            onClick={() => setPopup(null)}
            className="mt-5 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  );
}
