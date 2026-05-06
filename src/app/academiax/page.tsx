import Link from "next/link";
import { listCourses } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth/session";
import { AcademiaIcon, type AcademiaIconName } from "@/components/academiax/academiax-icons";

const CATEGORIES: Array<{ icon: AcademiaIconName; label: string }> = [
  { icon: "piano", label: "Producción" },
  { icon: "guitar", label: "Guitarra" },
  { icon: "mic", label: "Voz & Canto" },
  { icon: "sliders", label: "Mezcla & Master" },
  { icon: "megaphone", label: "Marketing Musical" },
  { icon: "briefcase", label: "Negocio Musical" },
  { icon: "grid", label: "Ableton Live" },
  { icon: "music", label: "Teoría Musical" },
];

const TESTIMONIALS = [
  {
    name: "Sofia Castro",
    role: "Productora",
    initials: "SC",
    quote:
      "RitmoHub Academy transformó completamente mi enfoque en producción. Los cursos son increíblemente prácticos y los instructores realmente saben de lo que hablan.",
    gradient: "linear-gradient(135deg,#ef4444,#dc2626)",
  },
  {
    name: "Marcos Ureña",
    role: "Guitarrista",
    initials: "MU",
    quote:
      "En tres meses pasé de saber tocar acordes básicos a componer mis propias canciones. La estructura de los cursos es perfecta para autodidactas.",
    gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)",
  },
  {
    name: "Valentina Cruz",
    role: "Cantante",
    initials: "VC",
    quote:
      "El curso de Voz & Canto me dio herramientas que nunca habría encontrado en clases presenciales. Mi rango vocal mejoró notablemente en pocas semanas.",
    gradient: "linear-gradient(135deg,#06b6d4,#6366f1)",
  },
  {
    name: "Diego Fuentes",
    role: "Ingeniero de sonido",
    initials: "DF",
    quote:
      "La calidad del contenido de mezcla y masterización es de nivel profesional. Definitivamente vale cada centavo invertido.",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
  },
];

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Básico: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    Intermedio: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
    Avanzado: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
  };
  const c = colors[level] ?? { bg: "var(--ui-border)", color: "var(--ui-muted)" };
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {level}
    </span>
  );
}

export default async function AcademiaXHomePage() {
  const [courses] = await Promise.all([listCourses(), getSessionFromCookie()]);
  const featuredCourses = courses.filter((c) => c.priceUsd > 1).slice(0, 4);

  return (
    <main className="pt-24" style={{ background: "var(--ui-bg)", color: "var(--ui-text)" }}>
      {/* ── HERO ── */}
      <section
        className="relative flex min-h-screen items-center overflow-hidden px-6"
        style={{ background: "var(--ui-bg)" }}
      >
        {/* Ambient blobs */}
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] animate-pulse rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            animationDuration: "6s",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
            animationDuration: "8s",
          }}
        />
        {/* Grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#6366f1" }}
              />
              Plataforma de aprendizaje musical
            </div>

            <h1
              className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl"
              style={{ color: "var(--ui-text)" }}
            >
              Domina la{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                música
              </span>{" "}
              con expertos reales
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: "var(--ui-muted)" }}>
              Cursos diseñados por profesionales activos de la industria. Aprende producción,
              mezcla, teoría, instrumento y más — a tu propio ritmo.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/academiax/catalog"
                className="rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.3)",
                }}
              >
                Explorar cursos
              </Link>
              <Link
                href="/academiax/dashboard"
                className="rounded-2xl px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  border: "1px solid var(--ui-border)",
                  background: "var(--ui-surface)",
                  color: "var(--ui-text)",
                }}
              >
                Mi aprendizaje
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-2">
                {["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"].map((bg, i) => (
                  <span
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-[var(--ui-bg)]"
                    style={{ background: bg }}
                  />
                ))}
              </div>
              <p className="text-sm" style={{ color: "var(--ui-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--ui-text)" }}>
                  +2,400
                </span>{" "}
                estudiantes activos
              </p>
            </div>
          </div>

          {/* Right: 3D floating mockup */}
          <div className="flex items-center justify-center" style={{ perspective: "1200px" }}>
            <div
              className="ax-float w-full max-w-sm"
              style={{
                transform: "rotateX(6deg) rotateY(-14deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="overflow-hidden rounded-3xl"
                style={{
                  background: "var(--ui-surface)",
                  border: "1px solid var(--ui-border)",
                  boxShadow: "0 40px 80px -20px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.1)",
                }}
              >
                {/* Mock course image */}
                <div
                  className="relative h-44"
                  style={{
                    background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(99,102,241,0.3)", backdropFilter: "blur(12px)" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-7 w-7 text-white"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" fill="white" />
                      </svg>
                    </div>
                  </div>
                  <div
                    className="absolute bottom-3 left-4 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: "rgba(99,102,241,0.8)" }}
                  >
                    Intermedio
                  </div>
                </div>

                {/* Mock content */}
                <div className="p-5">
                  <div
                    className="h-4 w-3/4 rounded-full"
                    style={{ background: "var(--ui-border)" }}
                  />
                  <div
                    className="mt-2 h-3 w-1/2 rounded-full"
                    style={{ background: "var(--ui-border)" }}
                  />

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--ui-muted)" }}>
                      <span>Progreso</span>
                      <span style={{ color: "#818cf8" }}>65%</span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--ui-border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "65%",
                          background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Lesson rows */}
                  <div className="mt-4 space-y-2">
                    {[
                      { label: "Intro a la producción", done: true },
                      { label: "Síntesis básica", done: true },
                      { label: "Diseño de sonido", done: false },
                    ].map((lesson, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                          style={
                            lesson.done
                              ? { background: "#6366f1", color: "white" }
                              : { background: "var(--ui-border)", color: "var(--ui-muted)" }
                          }
                        >
                          {lesson.done ? "✓" : i + 1}
                        </span>
                        <div
                          className="h-2.5 flex-1 rounded-full"
                          style={{
                            background: lesson.done
                              ? "rgba(99,102,241,0.2)"
                              : "var(--ui-border)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: Trending Courses ── */}
      <section className="px-6 py-24" style={{ background: "var(--ui-bg)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "#6366f1" }}>
                Lo más popular
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--ui-text)" }}>
                Cursos en tendencia
              </h2>
            </div>
            <Link
              href="/academiax/catalog"
              className="hidden items-center gap-1.5 text-sm font-medium transition-colors hover:text-white sm:flex"
              style={{ color: "#818cf8" }}
            >
              Ver todos
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              {featuredCourses[0] && (
                <Link
                  href={`/academiax/courses/${featuredCourses[0].id}`}
                  className="ax-tilt group relative cursor-pointer overflow-hidden rounded-3xl md:col-span-7"
                  style={{
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredCourses[0].imageUrl}
                    alt={featuredCourses[0].title}
                    className="block h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 transform-gpu"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={featuredCourses[0].level} />
                    </div>
                    <h3 className="mt-3 text-xl font-bold leading-tight" style={{ color: "var(--ui-text)" }}>
                      {featuredCourses[0].title}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--ui-muted)" }}>
                      {featuredCourses[0].instructor}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-bold" style={{ color: "var(--ui-text)" }}>
                        USD {featuredCourses[0].priceUsd.toFixed(2)}
                      </span>
                      <span
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                      >
                        Ver curso
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {featuredCourses[1] && (
                <Link
                  href={`/academiax/courses/${featuredCourses[1].id}`}
                  className="ax-tilt-right ax-tilt group relative cursor-pointer overflow-hidden rounded-3xl md:col-span-5"
                  style={{
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredCourses[1].imageUrl}
                    alt={featuredCourses[1].title}
                    className="block h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 transform-gpu"
                  />
                  <div className="p-5">
                    <LevelBadge level={featuredCourses[1].level} />
                    <h3 className="mt-2 text-lg font-bold leading-tight" style={{ color: "var(--ui-text)" }}>
                      {featuredCourses[1].title}
                    </h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--ui-muted)" }}>
                      {featuredCourses[1].instructor}
                    </p>
                    <p className="mt-3 text-xl font-bold" style={{ color: "var(--ui-text)" }}>
                      USD {featuredCourses[1].priceUsd.toFixed(2)}
                    </p>
                  </div>
                </Link>
              )}

              {featuredCourses[2] && (
                <Link
                  href={`/academiax/courses/${featuredCourses[2].id}`}
                  className="ax-tilt group relative cursor-pointer overflow-hidden rounded-3xl md:col-span-5"
                  style={{
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredCourses[2].imageUrl}
                    alt={featuredCourses[2].title}
                    className="block h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 transform-gpu"
                  />
                  <div className="p-5">
                    <LevelBadge level={featuredCourses[2].level} />
                    <h3 className="mt-2 text-lg font-bold leading-tight" style={{ color: "var(--ui-text)" }}>
                      {featuredCourses[2].title}
                    </h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--ui-muted)" }}>
                      {featuredCourses[2].instructor}
                    </p>
                    <p className="mt-3 text-xl font-bold" style={{ color: "var(--ui-text)" }}>
                      USD {featuredCourses[2].priceUsd.toFixed(2)}
                    </p>
                  </div>
                </Link>
              )}

              {featuredCourses[3] && (
                <Link
                  href={`/academiax/courses/${featuredCourses[3].id}`}
                  className="ax-tilt-right ax-tilt group relative cursor-pointer overflow-hidden rounded-3xl md:col-span-7"
                  style={{
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredCourses[3].imageUrl}
                    alt={featuredCourses[3].title}
                    className="block h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 transform-gpu"
                  />
                  <div className="p-5">
                    <LevelBadge level={featuredCourses[3].level} />
                    <h3 className="mt-2 text-lg font-bold" style={{ color: "var(--ui-text)" }}>
                      {featuredCourses[3].title}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--ui-muted)" }}>
                      {featuredCourses[3].instructor}
                    </p>
                    <p className="mt-3 text-xl font-bold" style={{ color: "var(--ui-text)" }}>
                      USD {featuredCourses[3].priceUsd.toFixed(2)}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div
              className="rounded-3xl p-16 text-center"
              style={{
                background: "var(--ui-surface-soft)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <p style={{ color: "var(--ui-muted)" }}>Próximamente nuevos cursos. ¡Vuelve pronto!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section
        className="px-6 py-24"
        style={{ background: "var(--ui-surface-soft)", borderTop: "1px solid var(--ui-border)", borderBottom: "1px solid var(--ui-border)" }}
      >
        <div className="mx-auto max-w-7xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "#6366f1" }}>
            Todo lo que necesitas
          </p>
          <h2 className="mb-10 text-3xl font-bold sm:text-4xl" style={{ color: "var(--ui-text)" }}>
            Explora por categoría
          </h2>

          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href="/academiax/catalog"
                className="group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all"
                style={{
                  border: "1px solid var(--ui-border)",
                  background: "var(--ui-surface-soft)",
                  color: "var(--ui-muted)",
                }}
              >
                <AcademiaIcon name={cat.icon} className="h-4 w-4 transition-colors group-hover:text-white" />
                <span className="group-hover:text-white transition-colors">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="px-6 py-24" style={{ background: "var(--ui-bg)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "#6366f1" }}>
              Testimonios reales
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--ui-text)" }}>
              Lo que dicen nuestros estudiantes
            </h2>
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="w-80 shrink-0 snap-start rounded-3xl p-6"
                style={{
                  background: "var(--ui-surface)",
                  border: "1px solid var(--ui-border)",
                }}
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      fill="#f59e0b"
                      className="h-4 w-4"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: t.gradient }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--ui-text)" }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ui-muted)" }}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative overflow-hidden px-6 py-32" style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 80%,#2e1065 100%)" }}>
        {/* Geometric decoration */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
          style={{ border: "2px solid rgba(255,255,255,0.15)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full opacity-20"
          style={{ border: "1px solid rgba(255,255,255,0.2)" }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/4 h-px w-64 opacity-20"
          style={{
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Empieza tu journey musical hoy
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
            Únete a miles de músicos que ya están aprendiendo con los mejores instructores del
            mundo hispanohablante.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/academiax/catalog"
              className="rounded-2xl px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{
                border: "1px solid rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
              }}
            >
              Ver catálogo completo
            </Link>
            <Link
              href="/register"
              className="rounded-2xl px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "white", color: "#312e81" }}
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
