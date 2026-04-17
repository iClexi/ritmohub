import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  createCoursePurchaseIntent,
  getCourseById,
  updateCoursePurchaseCheckoutUrl,
  updateCoursePurchaseStatus,
} from "@/lib/db";
import { createCourseCheckoutSchema } from "@/lib/validations/workspace";

function normalizeAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}

function buildPaypalCheckoutUrl(input: {
  title: string;
  amount: number;
  appUrl: string;
  purchaseId: string;
  courseId: string;
}) {
  const paypalMeLink = process.env.PAYPAL_ME_LINK?.trim();
  if (paypalMeLink) {
    const base = paypalMeLink.replace(/\/+$/, "");
    return `${base}/${input.amount.toFixed(2)}`;
  }

  const businessEmail = process.env.PAYPAL_BUSINESS_EMAIL?.trim();
  if (businessEmail) {
    const params = new URLSearchParams({
      cmd: "_xclick",
      business: businessEmail,
      item_name: input.title,
      amount: input.amount.toFixed(2),
      currency_code: "USD",
      return: `${input.appUrl}/academiax/courses/${input.courseId}?payment=success&provider=paypal&purchase_id=${input.purchaseId}`,
      cancel_return: `${input.appUrl}/academiax/courses/${input.courseId}?payment=cancel&provider=paypal&purchase_id=${input.purchaseId}`,
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }

  const fallbackPaypalMeLink = "https://paypal.me/iClexiG";
  return `${fallbackPaypalMeLink}/${input.amount.toFixed(2)}`;
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
    return { error: "Stripe no configurado. Falta STRIPE_SECRET_KEY." };
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
    },
    body: params.toString(),
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
    const stripeMessage = payload?.error?.message;
    const stripeCode = payload?.error?.code;
    const suffix = stripeCode ? ` (${stripeCode})` : "";
    return {
      error:
        stripeMessage
          ? `Stripe respondio: ${stripeMessage}${suffix}`
          : `No se pudo crear la sesion de pago en Stripe (HTTP ${response.status}).`,
    };
  }

  if (!payload?.url) {
    return { error: "Stripe no devolvio una URL de checkout valida." };
  }

  return { url: payload.url };
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion para comprar cursos." }, { status: 401 });
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

    let checkoutUrl = "";
    let checkoutError: string | null = null;

    if (parsed.data.provider === "stripe") {
      const stripeResult = await createStripeCheckout({
        title: course.title,
        amount: course.priceUsd,
        appUrl,
        userId: sessionPayload.session.user.id,
        courseId: course.id,
        purchaseId: purchaseIntent.id,
        customerEmail: sessionPayload.session.user.email,
      });

      if (stripeResult.error) {
        checkoutError = stripeResult.error;
      } else {
        checkoutUrl = stripeResult.url ?? "";
      }
    } else {
      const paypalCheckoutUrl = buildPaypalCheckoutUrl({
        title: course.title,
        amount: course.priceUsd,
        appUrl,
        purchaseId: purchaseIntent.id,
        courseId: course.id,
      });
      checkoutUrl = paypalCheckoutUrl;
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
