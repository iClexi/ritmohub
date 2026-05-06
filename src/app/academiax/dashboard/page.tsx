import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth/session";
import { listCoursePurchasesByUser, getCourseById } from "@/lib/db";
import { AcademiaIcon, type AcademiaIconName } from "@/components/academiax/academiax-icons";

const ACHIEVEMENTS: Array<{
  icon: AcademiaIconName;
  title: string;
  desc: string;
  key: string;
}> = [
  {
    icon: "award",
    title: "Primera lección",
    desc: "Completar tu primera lección",
    key: "first",
  },
  {
    icon: "flame",
    title: "En racha",
    desc: "5 días seguidos de aprendizaje",
    key: "streak",
  },
  {
    icon: "bolt",
    title: "Velocista",
    desc: "Completar una lección en menos de 1 hora",
    key: "speed",
  },
  {
    icon: "target",
    title: "Enfocado",
    desc: "Completar 3 lecciones en un día",
    key: "focus",
  },
  {
    icon: "trophy",
    title: "Completista",
    desc: "Terminar tu primer curso",
    key: "complete",
  },
  {
    icon: "spark",
    title: "Explorador",
    desc: "Inscribirse en 3 cursos",
    key: "explorer",
  },
];

function simulateProgress(courseId: string): number {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
  }
  return 30 + (hash % 41);
}

export default async function RitmoHubAcademyDashboard() {
  const session = await getSessionFromCookie();
  if (!session) redirect("/login");

  const { user } = session.session;
  const purchases = await listCoursePurchasesByUser(user.id);
  const paidPurchases = purchases.filter((p) => p.status === "paid");

  const enrolledCourses = (
    await Promise.all(
      paidPurchases.map(async (p) => {
        const course = await getCourseById(p.courseId);
        return course ?? null;
      })
    )
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getCourseById>>>[];

  const totalHours = enrolledCourses.reduce((sum, course) => sum + course.priceUsd * 2, 0);
  const continueCourses = enrolledCourses.slice(0, 3);
  const hasEnrollments = enrolledCourses.length > 0;

  const unlockedAchievements = hasEnrollments
    ? new Set(["first", "streak"])
    : new Set<string>();

  return (
    <main className="min-h-screen pt-24" style={{ background: "var(--ui-bg)", color: "var(--ui-text)" }}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome banner */}
        <div
          className="relative mb-10 overflow-hidden rounded-3xl px-8 py-10"
          style={{
            background: "linear-gradient(135deg,rgba(239,68,68,0.2) 0%,rgba(220,38,38,0.15) 100%)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle,#ef4444,transparent)" }}
          />
          <p className="mb-1 text-sm font-medium" style={{ color: "#f87171" }}>
            Panel de aprendizaje
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--ui-text)" }}>
            <span className="inline-flex items-center gap-3">
              Bienvenido de vuelta, {user.name.split(" ")[0]}
              <AcademiaIcon name="spark" className="h-7 w-7 text-[#f87171]" />
            </span>
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--ui-muted)" }}>
            Continúa desde donde lo dejaste.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Cursos inscritos",
              value: enrolledCourses.length,
              icon: "book" as AcademiaIconName,
              color: "#6366f1",
            },
            {
              label: "Completados",
              value: 0,
              icon: "award" as AcademiaIconName,
              color: "#34d399",
            },
            {
              label: "Horas aprendidas",
              value: `${totalHours.toFixed(0)}h`,
              icon: "clock" as AcademiaIconName,
              color: "#f59e0b",
            },
            {
              label: "Racha actual",
              value: "5 días",
              icon: "flame" as AcademiaIconName,
              color: "#ef4444",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col rounded-2xl p-5"
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <AcademiaIcon name={stat.icon} className="h-7 w-7" style={{ color: stat.color }} />
              <p className="mt-3 text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ui-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Continue learning */}
        <section className="mb-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--ui-text)" }}>
              Continuar aprendiendo
            </h2>
            {enrolledCourses.length > 3 && (
              <Link
                href="/academiax/catalog"
                className="text-sm font-medium"
                style={{ color: "#818cf8" }}
              >
                Ver todos →
              </Link>
            )}
          </div>

          {continueCourses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {continueCourses.map((course) => {
                const progress = simulateProgress(course.id);
                return (
                  <div
                    key={course.id}
                    className="overflow-hidden rounded-3xl"
                    style={{
                      background: "var(--ui-surface)",
                      border: "1px solid var(--ui-border)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-5">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: "rgba(99,102,241,0.15)",
                          color: "#818cf8",
                        }}
                      >
                        {course.level}
                      </span>
                      <h3 className="mt-2 text-sm font-bold leading-snug" style={{ color: "var(--ui-text)" }}>
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--ui-muted)" }}>
                        {course.instructor}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div
                          className="mb-1.5 flex justify-between text-xs"
                          style={{ color: "var(--ui-muted)" }}
                        >
                          <span>Progreso</span>
                          <span style={{ color: "#818cf8" }}>{progress}%</span>
                        </div>
                        <div
                          className="h-1.5 overflow-hidden rounded-full"
                          style={{ background: "var(--ui-border)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progress}%`,
                              background: "linear-gradient(90deg,#ef4444,#dc2626)",
                            }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/academiax/courses/${course.id}/learn`}
                        className="mt-4 flex w-full items-center justify-center rounded-2xl py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                      >
                        Continuar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center rounded-3xl py-16 text-center"
              style={{
                background: "var(--ui-surface-soft)",
                border: "1px dashed var(--ui-border)",
              }}
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
              >
                <AcademiaIcon name="book" className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--ui-text)" }}>
                Aún no tienes cursos
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--ui-muted)" }}>
                Explora el catálogo y comienza tu journey musical.
              </p>
              <Link
                href="/academiax/catalog"
                className="mt-6 rounded-2xl px-7 py-3 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                Explorar cursos
              </Link>
            </div>
          )}
        </section>

        {/* Achievements */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--ui-text)" }}>
            Logros
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedAchievements.has(ach.key);
              return (
                <div
                  key={ach.key}
                  className="flex flex-col items-center rounded-2xl p-4 text-center transition-all"
                  style={{
                    background: unlocked
                      ? "rgba(99,102,241,0.1)"
                      : "var(--ui-surface-soft)",
                    border: unlocked
                      ? "1px solid rgba(99,102,241,0.3)"
                      : "1px solid var(--ui-border)",
                    opacity: unlocked ? 1 : 0.45,
                  }}
                >
                  <AcademiaIcon
                    name={ach.icon}
                    className="h-7 w-7"
                    style={{ color: unlocked ? "#818cf8" : "var(--ui-muted)" }}
                  />
                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{ color: unlocked ? "var(--ui-text)" : "var(--ui-muted)" }}
                  >
                    {ach.title}
                  </p>
                  <p className="mt-1 text-[10px] leading-tight" style={{ color: "var(--ui-muted)" }}>
                    {ach.desc}
                  </p>
                  {unlocked && (
                    <span
                      className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(99,102,241,0.25)", color: "#818cf8" }}
                    >
                      ✓ Desbloqueado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* All enrolled courses */}
        {enrolledCourses.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--ui-text)" }}>
              Todos mis cursos
            </h2>
            <div className="space-y-3">
              {enrolledCourses.map((course) => {
                const progress = simulateProgress(course.id);
                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 rounded-2xl p-4"
                    style={{
                      background: "var(--ui-surface-soft)",
                      border: "1px solid var(--ui-border)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="h-14 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold" style={{ color: "var(--ui-text)" }}>
                        {course.title}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--ui-muted)" }}>
                        {course.instructor}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="h-1.5 w-24 overflow-hidden rounded-full"
                          style={{ background: "var(--ui-border)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${progress}%`,
                              background: "linear-gradient(90deg,#ef4444,#dc2626)",
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: "#818cf8" }}>
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: "rgba(52,211,153,0.15)",
                          color: "#34d399",
                        }}
                      >
                        Pagado
                      </span>
                      <Link
                        href={`/academiax/courses/${course.id}/learn`}
                        className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white"
                        style={{ background: "rgba(99,102,241,0.4)" }}
                      >
                        Continuar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
