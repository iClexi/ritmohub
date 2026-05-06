import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  extractClientIp,
  recordClientVisit,
  recordSiteVisit,
  type ClientVisitPayload,
} from "@/lib/visit-tracking";

function num(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function int(value: unknown): number | null {
  const n = num(value);
  return n === null ? null : Math.trunc(n);
}

function str(value: unknown, max = 512): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ ok: false, message: "Sin datos" }, { status: 400 });
  }

  const payload: ClientVisitPayload = {
    visitId: str(body.visitId, 64),
    pagePath: str(body.pagePath, 1024),
    referrer: str(body.referrer, 1024),
    language: str(body.language, 32),
    languages: str(body.languages, 256),
    timezone: str(body.timezone, 64),
    timezoneOffset: int(body.timezoneOffset),
    screenWidth: int(body.screenWidth),
    screenHeight: int(body.screenHeight),
    viewportWidth: int(body.viewportWidth),
    viewportHeight: int(body.viewportHeight),
    pixelRatio: num(body.pixelRatio),
    colorDepth: int(body.colorDepth),
    platform: str(body.platform, 64),
    connection: str(body.connection, 32),
    cpuCores: int(body.cpuCores),
    memoryGb: num(body.memoryGb),
    touchPoints: int(body.touchPoints),
    dnt: str(body.dnt, 8),
  };

  const ip = extractClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  const siteVisitId = await recordSiteVisit({
    userId: user?.id ?? null,
    payload,
    ip,
    userAgent,
  });

  if (user) {
    await recordClientVisit({
      userId: user.id,
      payload,
      ip,
      userAgent,
    });
  }

  return NextResponse.json({ ok: true, authenticated: Boolean(user), visitId: siteVisitId });
}
