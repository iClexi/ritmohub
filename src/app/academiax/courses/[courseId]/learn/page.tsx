import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { CoursePlayer } from "@/components/courses/course-player";
import { getSessionFromCookie } from "@/lib/auth/session";
import {
  getCourseById,
  listCourseModulesByCourseId,
  userHasPaidCourseAccess,
} from "@/lib/db";

type Props = { params: Promise<{ courseId: string }> };

export default async function CourseLearnPage({ params }: Props) {
  const { courseId } = await params;
  const session = await getSessionFromCookie();

  if (!session) {
    redirect(`/login?redirect=/academiax/courses/${courseId}/learn`);
  }

  const [course, modules] = await Promise.all([
    getCourseById(courseId),
    listCourseModulesByCourseId(courseId),
  ]);

  if (!course) {
    notFound();
  }

  const hasPaid = await userHasPaidCourseAccess({
    userId: session.session.user.id,
    courseId,
  });

  if (!hasPaid) {
    redirect(`/academiax/courses/${courseId}`);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--ui-bg)]">
      {/* ── Topbar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4">
        <Link
          href={`/academiax/courses/${course.id}`}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text)] hover:text-[var(--ui-primary)]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {course.title}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[var(--ui-muted)] sm:inline">
            {course.instructor} · Nivel {course.level}
          </span>
          <Link
            href="/academiax/dashboard"
            className="rounded-xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* ── Player ── */}
      <CoursePlayer course={course} modules={modules} />
    </div>
  );
}
