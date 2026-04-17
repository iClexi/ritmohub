import { redirect } from "next/navigation";

import { CourseAdminEditor } from "@/components/courses/course-admin-editor";
import { getSessionFromCookie } from "@/lib/auth/session";
import { isAdminUserId } from "@/lib/db";

export default async function NewCoursePage() {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    redirect("/login?redirect=/academiax/courses/new");
  }

  const isAdmin = await isAdminUserId(sessionPayload.session.user.id);
  if (!isAdmin) {
    redirect("/dashboard?s=courses");
  }

  return <CourseAdminEditor mode="create" initialCourse={null} initialModules={[]} />;
}
