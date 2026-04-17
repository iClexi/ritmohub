import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { deleteCourseRecord, updateCourseRecord } from "@/lib/db";

type Props = { params: Promise<{ courseId: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { courseId } = await params;
    const body = await request.json();
    const course = await updateCourseRecord(courseId, {
      title: body.title !== undefined ? String(body.title) : undefined,
      instructor: body.instructor !== undefined ? String(body.instructor) : undefined,
      level: body.level !== undefined ? String(body.level) : undefined,
      imageUrl: body.imageUrl !== undefined ? String(body.imageUrl) : undefined,
      summary: body.summary !== undefined ? String(body.summary) : undefined,
      priceUsd: body.priceUsd !== undefined ? Number(body.priceUsd) : undefined,
    });
    if (!course) return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
    return NextResponse.json({ message: "Curso actualizado.", course });
  } catch (err) {
    console.error("update course error", err);
    return NextResponse.json({ message: "No pudimos actualizar el curso." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { courseId } = await params;
  const ok = await deleteCourseRecord(courseId);
  if (!ok) return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
  return NextResponse.json({ message: "Curso eliminado." });
}
