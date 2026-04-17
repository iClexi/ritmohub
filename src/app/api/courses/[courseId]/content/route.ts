import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { getCourseById, listCourseModulesByCourseId, userHasPaidCourseAccess } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> | { courseId: string } },
) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion para ver el contenido del curso." }, { status: 401 });
  }

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

  const hasAccess = await userHasPaidCourseAccess({
    userId: sessionPayload.session.user.id,
    courseId,
  });

  if (!hasAccess) {
    return NextResponse.json({ message: "No tienes acceso a este curso. Debes comprarlo primero." }, { status: 403 });
  }

  const modules = await listCourseModulesByCourseId(courseId);

  return NextResponse.json({
    course,
    modules,
  });
}

