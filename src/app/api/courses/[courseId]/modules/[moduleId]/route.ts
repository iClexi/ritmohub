import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { deleteCourseModuleRecord, getCourseById, updateCourseModuleRecord } from "@/lib/db";

type RouteContext = {
  params:
    | Promise<{ courseId: string; moduleId: string }>
    | { courseId: string; moduleId: string };
};

function normalizeLessonType(value: unknown): "video" | "reading" | "practice" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "video" || value === "reading" || value === "practice") {
    return value;
  }
  return undefined;
}

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
    const body = await request.json();
    const title = body?.title !== undefined ? String(body.title).trim() : undefined;
    const lessonType = normalizeLessonType(body?.lessonType);
    const durationMinutes =
      body?.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined;
    const content = body?.content !== undefined ? String(body.content).trim() : undefined;
    const videoUrl = body?.videoUrl !== undefined ? String(body.videoUrl).trim() : undefined;

    if (title !== undefined && title.length === 0) {
      return NextResponse.json({ message: "El titulo no puede estar vacio." }, { status: 400 });
    }
    if (durationMinutes !== undefined && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
      return NextResponse.json({ message: "La duracion es invalida." }, { status: 400 });
    }
    if (content !== undefined && content.length === 0) {
      return NextResponse.json({ message: "El contenido no puede estar vacio." }, { status: 400 });
    }

    const updatedModule = await updateCourseModuleRecord({
      courseId,
      moduleId,
      title,
      lessonType,
      durationMinutes,
      content,
      videoUrl,
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
