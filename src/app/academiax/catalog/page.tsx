import { listCourses, listCoursePurchasesByUser } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth/session";
import { CatalogClient } from "./catalog-client";

export default async function CatalogPage() {
  const [courses, session] = await Promise.all([listCourses(), getSessionFromCookie()]);
  const userId = session?.session.user.id ?? null;
  const purchases = userId ? await listCoursePurchasesByUser(userId) : [];
  const paidCourseIds = new Set(
    purchases.filter((p) => p.status === "paid").map((p) => p.courseId)
  );
  return <CatalogClient courses={courses} paidCourseIds={[...paidCourseIds]} />;
}
