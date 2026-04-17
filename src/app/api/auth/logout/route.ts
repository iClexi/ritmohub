import { NextResponse } from "next/server";

import { invalidateCurrentSession } from "@/lib/auth/session";

export async function POST() {
  await invalidateCurrentSession();

  return NextResponse.json({ message: "Sesión cerrada." });
}

