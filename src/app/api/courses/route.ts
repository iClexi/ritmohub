import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { getSessionFromCookie } from "@/lib/auth/session";
import { createCourseRecord, listCoursePurchasesByUser, listCourses } from "@/lib/db";
import { createCourseSchema } from "@/lib/validations/workspace";

export async function GET() {
  const sessionPayload = await getSessionFromCookie();
  const courses = await listCourses();

  if (!sessionPayload) {
    return NextResponse.json({ courses, purchases: [] });
  }

  return NextResponse.json({
    courses,
    purchases: await listCoursePurchasesByUser(sessionPayload.session.user.id),
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const parsed = createCourseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los datos del curso.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const course = await createCourseRecord({
      ...parsed.data,
      instructorUserId: guard.userId,
    });
    return NextResponse.json({ message: "Curso creado.", course });
  } catch (err) {
    console.error("create course error", err);
    return NextResponse.json({ message: "No pudimos crear el curso." }, { status: 500 });
  }
}
