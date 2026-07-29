import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { getCoursePurchaseByIdForUser, updateCoursePurchaseStatus } from "@/lib/db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { confirmCourseCheckoutSchema } from "@/lib/validations/workspace";

type StripeSessionPayload = {
  id: string;
  amount_total?: number | null;
  client_reference_id?: string | null;
  currency?: string | null;
  mode?: string;
  payment_status?: string;
  status?: string;
  metadata?: {
    user_id?: string;
    course_id?: string;
    purchase_id?: string;
  };
};

async function fetchStripeSession(sessionId: string): Promise<{
  ok: boolean;
  payload: StripeSessionPayload | null;
  message?: string;
}> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    console.error("stripe confirmation unavailable: missing server configuration");
    return { ok: false, payload: null, message: "El pago no esta disponible temporalmente." };
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | (StripeSessionPayload & { error?: { code?: string; type?: string } })
    | null;

  if (!response.ok) {
    console.warn("stripe confirmation rejected", {
      status: response.status,
      code: payload?.error?.code,
      type: payload?.error?.type,
    });
    return {
      ok: false,
      payload: null,
      message: "No se pudo validar la sesion de pago.",
    };
  }

  return { ok: true, payload };
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion para confirmar pagos." }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `payments:confirm:${sessionPayload.session.user.id}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const parsed = confirmCourseCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos de confirmacion invalidos.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const purchase = await getCoursePurchaseByIdForUser({
      purchaseId: parsed.data.purchaseId,
      userId: sessionPayload.session.user.id,
    });

    if (!purchase) {
      return NextResponse.json({ message: "Compra no encontrada." }, { status: 404 });
    }

    if (purchase.provider !== "stripe" || purchase.provider !== parsed.data.provider) {
      return NextResponse.json({ message: "Proveedor no coincide con la compra registrada." }, { status: 400 });
    }

    if (purchase.status === "paid") {
      return NextResponse.json({ message: "Compra ya confirmada.", purchase });
    }

    const stripeSession = await fetchStripeSession(parsed.data.sessionId);
    if (!stripeSession.ok || !stripeSession.payload) {
      return NextResponse.json({ message: stripeSession.message ?? "No se pudo validar el pago en Stripe." }, { status: 400 });
    }

    const metadata = stripeSession.payload.metadata ?? {};
    const expectedAmount = Math.round(purchase.amountUsd * 100);
    const metadataMatches =
      metadata.purchase_id === purchase.id &&
      metadata.user_id === purchase.userId &&
      metadata.course_id === purchase.courseId;
    const checkoutMatches =
      stripeSession.payload.id === parsed.data.sessionId &&
      stripeSession.payload.client_reference_id === purchase.id &&
      stripeSession.payload.mode === "payment" &&
      stripeSession.payload.amount_total === expectedAmount &&
      stripeSession.payload.currency?.toUpperCase() === purchase.currency.toUpperCase();

    if (!metadataMatches || !checkoutMatches) {
      return NextResponse.json({ message: "La sesion de pago no coincide con la compra del usuario." }, { status: 400 });
    }

    if (
      stripeSession.payload.payment_status !== "paid" ||
      stripeSession.payload.status !== "complete"
    ) {
      const nextStatus = stripeSession.payload.status === "expired" ? "failed" : "pending";
      const updatedPurchase = await updateCoursePurchaseStatus({
        purchaseId: purchase.id,
        userId: purchase.userId,
        status: nextStatus,
      });
      return NextResponse.json(
        {
          message: "El pago aun no aparece como completado en Stripe.",
          purchase: updatedPurchase ?? purchase,
        },
        { status: 400 },
      );
    }

    const updatedPurchase = await updateCoursePurchaseStatus({
      purchaseId: purchase.id,
      userId: purchase.userId,
      status: "paid",
    });

    return NextResponse.json({
      message: "Pago confirmado. Curso desbloqueado.",
      purchase: updatedPurchase ?? purchase,
    });
  } catch (error) {
    console.error("payment confirm error", error);
    return NextResponse.json({ message: "No pudimos confirmar el pago." }, { status: 500 });
  }
}
