import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { listRecentSiteTraffic } from "@/lib/visit-tracking";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return guard.response;
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "60");
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
    : 60;
  const visits = await listRecentSiteTraffic(limit);

  return NextResponse.json({ visits, generatedAt: new Date().toISOString() });
}
