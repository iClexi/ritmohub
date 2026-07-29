import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  createCoursePurchaseIntent,
  getCourseById,
  updateCoursePurchaseCheckoutUrl,
  updateCoursePurchaseStatus,
} from "@/lib/db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { createCourseCheckoutSchema } from "@/lib/validations/workspace";

function normalizeAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const candidate =
    configured ||
    (process.env.NODE_ENV === "production" ? "" : new URL(request.url).origin);

  if (!candidate) {
    throw new Error("NEXT_PUBLIC_APP_URL no esta configurada.");
  }

  const appUrl = new URL(candidate);
  if (
    !["http:", "https:"].includes(appUrl.protocol) ||
    appUrl.username ||
    appUrl.password
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL debe usar HTTP o HTTPS.");
  }

  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL debe usar HTTPS en produccion.");
  }

  return appUrl.origin;
}

function isStripeCheckoutUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

async function createStripeCheckout(input: {
  title: string;
  amount: number;
  appUrl: string;
  userId: string;
  courseId: string;
  purchaseId: string;
  customerEmail: string;
}) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    console.error("stripe checkout unavailable: missing server configuration");
    return { error: "El pago no esta disponible temporalmente." };
  }

  const amountInCents = Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    return { error: "Monto invalido para crear el checkout en Stripe." };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set(
    "success_url",
    `${input.appUrl}/academiax/courses/${input.courseId}?payment=success&provider=stripe&purchase_id=${input.purchaseId}&session_id={CHECKOUT_SESSION_ID}`,
  );
  params.set(
    "cancel_url",
    `${input.appUrl}/academiax/courses/${input.courseId}?payment=cancel&provider=stripe&purchase_id=${input.purchaseId}`,
  );
  params.set("payment_method_types[0]", "card");
  params.set("customer_email", input.customerEmail);
  params.set("client_reference_id", input.purchaseId);
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(amountInCents));
  params.set("line_items[0][price_data][product_data][name]", input.title);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[course_id]", input.courseId);
  params.set("metadata[purchase_id]", input.purchaseId);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": input.purchaseId,
    },
    body: params.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        id?: string;
        url?: string;
        error?: {
          message?: string;
          code?: string;
          type?: string;
        };
      }
    | null;

  if (!response.ok) {
    console.warn("stripe checkout rejected", {
      status: response.status,
      code: payload?.error?.code,
      type: payload?.error?.type,
    });
    return {
      error: "Stripe no pudo iniciar el pago. Intenta nuevamente.",
    };
  }

  if (!payload?.id || !payload.url || !isStripeCheckoutUrl(payload.url)) {
    return { error: "Stripe no devolvio una URL de checkout valida." };
  }

  return { url: payload.url };
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion para comprar cursos." }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `payments:checkout:${sessionPayload.session.user.id}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
    blockMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const parsed = createCourseCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos de pago invalidos.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const course = await getCourseById(parsed.data.courseId);
    if (!course) {
      return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
    }

    const appUrl = normalizeAppUrl(request);
    const purchaseIntent = await createCoursePurchaseIntent({
      courseId: course.id,
      userId: sessionPayload.session.user.id,
      provider: parsed.data.provider,
      status: "pending",
      amountUsd: course.priceUsd,
      currency: "USD",
      checkoutUrl: "about:blank",
    });

    const stripeResult = await createStripeCheckout({
      title: course.title,
      amount: course.priceUsd,
      appUrl,
      userId: sessionPayload.session.user.id,
      courseId: course.id,
      purchaseId: purchaseIntent.id,
      customerEmail: sessionPayload.session.user.email,
    });

    let checkoutUrl = "";
    let checkoutError: string | null = null;
    if (stripeResult.error) {
      checkoutError = stripeResult.error;
    } else {
      checkoutUrl = stripeResult.url ?? "";
    }

    if (checkoutError || !checkoutUrl) {
      await updateCoursePurchaseStatus({
        purchaseId: purchaseIntent.id,
        userId: sessionPayload.session.user.id,
        status: "failed",
      });
      return NextResponse.json({ message: checkoutError ?? "No se pudo crear el checkout." }, { status: 400 });
    }

    const purchase =
      (await updateCoursePurchaseCheckoutUrl({
        purchaseId: purchaseIntent.id,
        userId: sessionPayload.session.user.id,
        checkoutUrl,
      })) ?? purchaseIntent;

    return NextResponse.json({
      message: "Checkout generado.",
      checkoutUrl,
      purchase,
    });
  } catch (error) {
    console.error("course checkout error", error);
    return NextResponse.json({ message: "No pudimos iniciar el proceso de pago." }, { status: 500 });
  }
}
