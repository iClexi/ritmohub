import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  getCourseById,
  getUserById,
  listCourseModulesByCourseId,
  userHasPaidCourseAccess,
} from "@/lib/db";
import { CourseDetailTabs } from "@/components/courses/course-detail-tabs";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";

type Props = { params: Promise<{ courseId: string }> };

function enrollmentCount(courseId: string): number {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
  }
  return (hash % 500) + 200;
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const [course, modules, session] = await Promise.all([
    getCourseById(courseId),
    listCourseModulesByCourseId(courseId),
    getSessionFromCookie(),
  ]);

  if (!course) {
    notFound();
  }

  const userId = session?.session.user.id ?? null;

  const [instructorUser, hasPaid] = await Promise.all([
    course.instructorUserId ? getUserById(course.instructorUserId) : Promise.resolve(null),
    userId ? userHasPaidCourseAccess({ userId, courseId }) : Promise.resolve(false),
  ]);

  const totalMinutes = modules.reduce((sum, m) => sum + m.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const videoCount = modules.filter((m) => m.lessonType === "video").length;
  const readingCount = modules.filter((m) => m.lessonType === "reading").length;
  const practiceCount = modules.filter((m) => m.lessonType === "practice").length;
  const enrollment = enrollmentCount(courseId);

  const whatYouLearn =
    modules.length > 0
      ? modules.slice(0, 6).map((m) => m.title)
      : [
          "Ruta clara de aprendizaje por módulos.",
          "Ejercicios aplicables a tu proyecto musical.",
          "Recursos y referencias para avanzar más rápido.",
          "Proyecto final evaluado con rúbrica.",
          "Acceso a la comunidad de estudiantes.",
          "Certificado de finalización del curso.",
        ];

  const levelColors: Record<string, { bg: string; color: string }> = {
    Básico: { bg: "rgba(16,185,129,0.2)", color: "#34d399" },
    Intermedio: { bg: "rgba(99,102,241,0.2)", color: "#818cf8" },
    Avanzado: { bg: "rgba(239,68,68,0.2)", color: "#f87171" },
    Test: { bg: "rgba(255,255,255,0.08)", color: "#94a3b8" },
  };
  const lc = levelColors[course.level] ?? levelColors["Test"];

  return (
    <div className="pt-20" style={{ background: "var(--ui-bg)", color: "var(--ui-text)", minHeight: "100vh" }}>
      {/* Back nav */}
      <div
        className="sticky top-[72px] z-30 px-6 py-3"
        style={{
          background: "var(--ui-surface)",
          borderBottom: "1px solid var(--ui-border)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/academiax/catalog"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--ui-muted)" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver al catálogo
          </Link>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
          >
            RitmoHub Academy
          </span>
        </div>
      </div>

      {/* Hero banner */}
      <section className="relative overflow-hidden">
        {/* Blurred bg image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ transform: "scale(1.1)", filter: "blur(32px) brightness(0.25)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(7,7,15,0.95) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Left: info */}
            <div>
              {/* Badges */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: lc.bg, color: lc.color }}
                >
                  {course.level}
                </span>
                {course.priceUsd <= 1 && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
                  >
                    Demo
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                {course.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {course.summary}
              </p>

              {/* Instructor */}
              <div className="mt-6 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                >
                  {course.instructor.charAt(0).toUpperCase()}
                </span>
                <div>
                  {instructorUser ? (
                    <Link
                      href={`/artist/${instructorUser.id}`}
                      className="text-sm font-semibold text-white hover:underline"
                    >
                      {instructorUser.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-white">{course.instructor}</p>
                  )}
                  <p className="text-xs" style={{ color: "#818cf8" }}>
                    Instructor certificado
                  </p>
                </div>
              </div>

              {/* Stats chips */}
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: "⏱️", label: `${totalHours}h de contenido` },
                  { icon: "📚", label: `${modules.length} lecciones` },
                  { icon: "🎯", label: course.level },
                  { icon: "👥", label: `${enrollment.toLocaleString()} estudiantes` },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: CTA card */}
            <div className="self-start">
              <div
                className="overflow-hidden rounded-3xl"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 40px 80px -20px rgba(99,102,241,0.3)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  className="h-44 w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-3xl font-bold text-white">
                    USD {course.priceUsd.toFixed(2)}
                  </p>

                  {hasPaid ? (
                    <Link
                      href={`/academiax/courses/${course.id}/learn`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Entrar al curso
                    </Link>
                  ) : userId ? (
                    <div className="mt-4 space-y-2">
                      <CourseCheckoutButton
                        courseId={course.id}
                        provider="stripe"
                        label="Comprar con Stripe"
                        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                      />
                      <CourseCheckoutButton
                        courseId={course.id}
                        provider="paypal"
                        label="Comprar con PayPal"
                        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
                      />
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="mt-4 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                    >
                      Inicia sesión para comprar
                    </Link>
                  )}

                  {/* Feature list */}
                  <ul className="mt-5 space-y-2.5">
                    {[
                      `${totalHours}h de contenido`,
                      `${modules.length} lecciones (${videoCount > 0 ? `${videoCount} videos` : ""}${readingCount > 0 ? `, ${readingCount} lecturas` : ""}${practiceCount > 0 ? `, ${practiceCount} prácticas` : ""})`,
                      `Nivel ${course.level}`,
                      "Acceso de por vida",
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                        >
                          ✓
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* Share/wishlist */}
                  <div className="mt-5 flex items-center gap-2 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      Compartir
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Left: tabs */}
          <div>
            <CourseDetailTabs
              modules={modules}
              whatYouLearn={whatYouLearn}
              instructor={course.instructor}
              instructorUser={
                instructorUser
                  ? {
                      id: instructorUser.id,
                      name: instructorUser.name,
                      bio: instructorUser.bio,
                      primaryInstrument: instructorUser.primaryInstrument,
                      studies: instructorUser.studies,
                    }
                  : null
              }
            />
          </div>

          {/* Right: sticky sidebar */}
          <div className="hidden lg:block">
            <div
              className="sticky top-36 rounded-3xl p-6"
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Resumen del curso
              </p>
              <p className="mt-3 text-2xl font-bold" style={{ color: "var(--ui-text)" }}>
                USD {course.priceUsd.toFixed(2)}
              </p>

              {hasPaid ? (
                <Link
                  href={`/academiax/courses/${course.id}/learn`}
                  className="mt-4 flex w-full items-center justify-center rounded-2xl py-3 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                >
                  Entrar al curso →
                </Link>
              ) : userId ? (
                <div className="mt-4 space-y-2">
                  <CourseCheckoutButton
                    courseId={course.id}
                    provider="stripe"
                    label="Comprar con Stripe"
                    className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                  />
                  <CourseCheckoutButton
                    courseId={course.id}
                    provider="paypal"
                    label="Comprar con PayPal"
                    className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
                  />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="mt-4 flex w-full items-center justify-center rounded-2xl py-3 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                >
                  Iniciar sesión
                </Link>
              )}

              <div className="mt-5 space-y-2">
                {[
                  { icon: "📚", label: `${modules.length} lecciones` },
                  { icon: "⏱️", label: `${totalHours}h de contenido` },
                  { icon: "🎯", label: `Nivel ${course.level}` },
                  { icon: "♾️", label: "Acceso de por vida" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm" style={{ color: "var(--ui-muted)" }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
