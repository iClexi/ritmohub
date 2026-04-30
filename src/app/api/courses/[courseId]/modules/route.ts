import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  createCourseModuleRecord,
  getCourseById,
  listCourseModulesByCourseId,
} from "@/lib/db";

type RouteContext = {
  params: Promise<{ courseId: string }> | { courseId: string };
};

function normalizeLessonType(value: unknown): "video" | "reading" | "practice" | null {
  if (value === "video" || value === "reading" || value === "practice") {
    return value;
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const courseId = resolvedParams.courseId;

  if (!courseId) {
    return NextResponse.json({ message: "Curso invalido." }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
  }

  const modules = await listCourseModulesByCourseId(courseId);
  return NextResponse.json({ modules });
}

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const courseId = resolvedParams.courseId;

  if (!courseId) {
    return NextResponse.json({ message: "Curso invalido." }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ message: "Curso no encontrado." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const title = String(body?.title ?? "").trim();
    const lessonType = normalizeLessonType(body?.lessonType);
    const durationMinutes = Number(body?.durationMinutes ?? 0);
    const content = String(body?.content ?? "").trim();
    const videoUrl = String(body?.videoUrl ?? "").trim();

    if (!title || !lessonType || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || !content) {
      return NextResponse.json(
        { message: "Datos de modulo invalidos." },
        { status: 400 },
      );
    }

    const createdModule = await createCourseModuleRecord({
      courseId,
      title,
      lessonType,
      durationMinutes,
      content,
      videoUrl,
    });

    if (!createdModule) {
      return NextResponse.json({ message: "No se pudo crear el modulo." }, { status: 500 });
    }

    return NextResponse.json({ message: "Modulo creado.", module: createdModule });
  } catch (error) {
    console.error("create module error", error);
    return NextResponse.json({ message: "No se pudo crear el modulo." }, { status: 500 });
  }
}
