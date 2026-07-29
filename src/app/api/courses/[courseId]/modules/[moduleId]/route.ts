import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { deleteCourseModuleRecord, getCourseById, updateCourseModuleRecord } from "@/lib/db";
import { updateCourseModuleSchema } from "@/lib/validations/workspace";

type RouteContext = {
  params:
    | Promise<{ courseId: string; moduleId: string }>
    | { courseId: string; moduleId: string };
};

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const { courseId, moduleId } = resolvedParams;

  if (!courseId || !moduleId) {
    return NextResponse.json({ message: "Parametros invalidos." }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
  }

  try {
    const parsed = updateCourseModuleSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos de modulo invalidos.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const updatedModule = await updateCourseModuleRecord({
      courseId,
      moduleId,
      ...parsed.data,
    });

    if (!updatedModule) {
      return NextResponse.json({ message: "Modulo no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Modulo actualizado.", module: updatedModule });
  } catch (error) {
    console.error("update module error", error);
    return NextResponse.json({ message: "No se pudo actualizar el modulo." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const { courseId, moduleId } = resolvedParams;

  if (!courseId || !moduleId) {
    return NextResponse.json({ message: "Parametros invalidos." }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
  }

  const ok = await deleteCourseModuleRecord({ courseId, moduleId });
  if (!ok) {
    return NextResponse.json({ message: "Modulo no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ message: "Modulo eliminado." });
}
