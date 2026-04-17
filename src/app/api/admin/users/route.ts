import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { listUsersForAdmin } from "@/lib/db";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return guard.response;
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const users = await listUsersForAdmin({ query, limit: 200 });

  return NextResponse.json({ users });
}
