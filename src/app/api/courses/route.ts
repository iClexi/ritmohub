import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { getSessionFromCookie } from "@/lib/auth/session";
import { createCourseRecord, listCoursePurchasesByUser, listCourses } from "@/lib/db";

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
    const body = await request.json();
    if (!body?.title || !body?.summary) {
      return NextResponse.json({ message: "Titulo y descripcion son requeridos." }, { status: 400 });
    }
    const course = await createCourseRecord({
      title: String(body.title),
      instructor: String(body.instructor ?? "Admin"),
      level: String(body.level ?? "Intermedio"),
      imageUrl: String(body.imageUrl ?? "https://source.unsplash.com/900x600/?music,course"),
      summary: String(body.summary),
      priceUsd: Number(body.priceUsd ?? 0),
    });
    return NextResponse.json({ message: "Curso creado.", course });
  } catch (err) {
    console.error("create course error", err);
    return NextResponse.json({ message: "No pudimos crear el curso." }, { status: 500 });
  }
}
