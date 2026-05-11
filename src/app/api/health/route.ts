import { NextResponse } from "next/server";

import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    return NextResponse.json(
      { ok: true, db: "up", uptimeMs: process.uptime() * 1000, latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
