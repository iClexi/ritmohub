import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { deleteCourseRecord, updateCourseRecord } from "@/lib/db";
import { updateCourseSchema } from "@/lib/validations/workspace";

type Props = { params: Promise<{ courseId: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { courseId } = await params;
    const parsed = updateCourseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los datos del curso.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const course = await updateCourseRecord(courseId, parsed.data);
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
