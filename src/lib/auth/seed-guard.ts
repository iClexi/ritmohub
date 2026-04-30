import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

function secretsMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function requireSeedAccess(request: Request) {
  if (process.env.ENABLE_SEED_ROUTES !== "true") {
    return NextResponse.json({ message: "Seed deshabilitado." }, { status: 404 });
  }

  const expectedToken = process.env.SEED_ROUTE_TOKEN?.trim();
  if (!expectedToken) {
    return NextResponse.json(
      { message: "Define SEED_ROUTE_TOKEN antes de habilitar rutas seed." },
      { status: 500 },
    );
  }

  const receivedToken = request.headers.get("x-seed-token") ?? getBearerToken(request);
  if (!receivedToken || !secretsMatch(receivedToken, expectedToken)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  return null;
}
