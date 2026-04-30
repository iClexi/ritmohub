import { notFound, redirect } from "next/navigation";

import { CourseAdminEditor } from "@/components/courses/course-admin-editor";
import { getSessionFromCookie } from "@/lib/auth/session";
import {
  getCourseById,
  isAdminUserId,
  listCourseModulesByCourseId,
} from "@/lib/db";

type Props = { params: Promise<{ courseId: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { courseId } = await params;
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    redirect(`/login?redirect=/academiax/courses/${courseId}/edit`);
  }

  const isAdmin = await isAdminUserId(sessionPayload.session.user.id);
  if (!isAdmin) {
    redirect("/dashboard?s=courses");
  }

  const [course, modules] = await Promise.all([
    getCourseById(courseId),
    listCourseModulesByCourseId(courseId),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <CourseAdminEditor
      mode="edit"
      initialCourse={{
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        level: course.level,
        imageUrl: course.imageUrl,
        summary: course.summary,
        priceUsd: course.priceUsd,
      }}
      initialModules={modules.map((module) => ({
        id: module.id,
        position: module.position,
        title: module.title,
        lessonType: module.lessonType,
        durationMinutes: module.durationMinutes,
        content: module.content,
        videoUrl: module.videoUrl,
      }))}
    />
  );
}
