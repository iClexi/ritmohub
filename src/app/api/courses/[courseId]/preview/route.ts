import { NextResponse } from "next/server";

import { getCourseById, getUserById, listCourseModulesByCourseId } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> | { courseId: string } },
) {
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
  const whatYouLearn = modules.slice(0, 5).map((module) => module.title);
  const instructorUser = course.instructorUserId
    ? await getUserById(course.instructorUserId)
    : null;

  return NextResponse.json({
    course,
    whatYouLearn:
      whatYouLearn.length > 0
        ? whatYouLearn
        : [
            "Ruta clara de aprendizaje por modulos.",
            "Ejercicios aplicables a tu proyecto musical.",
            "Recursos y referencias para avanzar mas rapido.",
          ],
    modules: modules.map((module) => ({
      id: module.id,
      title: module.title,
      lessonType: module.lessonType,
      durationMinutes: module.durationMinutes,
      position: module.position,
    })),
    instructorUser: instructorUser
      ? {
          id: instructorUser.id,
          name: instructorUser.name,
          email: instructorUser.email,
        }
      : null,
  });
}

