import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { deleteJobRecord } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const ok = await deleteJobRecord(id);
  if (!ok) return NextResponse.json({ message: "Oportunidad no encontrada." }, { status: 404 });
  return NextResponse.json({ message: "Oportunidad eliminada." });
}
