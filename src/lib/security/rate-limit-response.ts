import { NextResponse } from "next/server";

export function createRateLimitKey(scope: string, channel: string, dimension: string, value: string) {
  return `${scope}:${channel}:${dimension}:${value}`;
}

export function rateLimitExceededResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { message: "Demasiados intentos. Espera unos minutos e intenta otra vez." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
