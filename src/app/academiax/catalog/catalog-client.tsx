"use client";

import { type MouseEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Course = {
  id: string;
  title: string;
  instructor: string;
  level: string;
  imageUrl: string;
  summary: string;
  priceUsd: number;
  createdAt: string;
};

type Props = {
  courses: Course[];
  paidCourseIds: string[];
};

type OwnershipFilter = "Todos" | "Ya los poseo" | "No los tengo";
type CostFilter = "Todos" | "Economico" | "Medio" | "Premium";
type DurationFilter = "Todas" | "Corta" | "Media" | "Larga";
type CourseTopic = "General" | "Produccion" | "Performance" | "Instrumento" | "Negocio";
type CourseTopicFilter = "Todos" | CourseTopic;

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  Basico: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
  Básico: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
  Intermedio: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  Avanzado: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
};

function getCourseTopic(course: Pick<Course, "title" | "summary">): CourseTopic {
  const haystack = `${course.title} ${course.summary}`.toLowerCase();

  if (/(marketing|booking|negocia|negocio|branding|ventas)/.test(haystack)) {
    return "Negocio";
  }

  if (/(voz|escenic|show|performance|presencia)/.test(haystack)) {
    return "Performance";
  }

  if (/(guitarra|bajo|piano|bateria|instrument|ritmica)/.test(haystack)) {
    return "Instrumento";
  }

  if (/(ableton|mix|master|beat|produccion|mezcla|streaming)/.test(haystack)) {
    return "Produccion";
  }

  return "General";
}

function getCourseDurationHours(course: Pick<Course, "id" | "title">) {
  const source = `${course.id}-${course.title}`;
  let seed = 0;

  for (const char of source) {
    seed += char.charCodeAt(0);
  }

  const minutes = 80 + (seed % 201);
  return minutes / 60;
}

function getCourseDurationFilter(hours: number): DurationFilter {
  if (hours < 2.5) {
    return "Corta";
  }
  if (hours <= 3.8) {
    return "Media";
  }
  return "Larga";
}

function getCourseModuleCount(hours: number) {
  return Math.max(6, Math.round(hours * 4.5));
}

function matchesCourseCost(priceUsd: number, filter: CostFilter) {
  if (filter === "Todos") {
    return true;
  }
  if (filter === "Economico") {
    return priceUsd <= 40;
  }
  if (filter === "Medio") {
    return priceUsd > 40 && priceUsd <= 70;
  }
  return priceUsd > 70;
}

function LevelBadge({ level }: { level: string }) {
  const c = LEVEL_COLORS[level] ?? { bg: "var(--ui-border)", color: "var(--ui-muted)" };
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {level}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function CatalogClient({ courses, paidCourseIds }: Props) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwnership, setSelectedOwnership] = useState<OwnershipFilter>("Todos");
  const [selectedCost, setSelectedCost] = useState<CostFilter>("Todos");
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>("Todas");
  const [selectedTopic, setSelectedTopic] = useState<CourseTopicFilter>("Todos");
  const [selectedLevel, setSelectedLevel] = useState("Todos");
  const [sortBy, setSortBy] = useState("reciente");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openingCourseId, setOpeningCourseId] = useState<string | null>(null);

  const handleOpenCourse = (event: MouseEvent<HTMLAnchorElement>, courseId: string) => {
    event.preventDefault();
    if (isNavigating && openingCourseId === courseId) {
      return;
    }
    setOpeningCourseId(courseId);
    startNavigation(() => {
      router.push(`/academiax/courses/${courseId}`);
    });
  };

  const paidSet = useMemo(() => new Set(paidCourseIds), [paidCourseIds]);
  const levels = useMemo(() => {
    const uniqueLevels = new Map<string, string>();
    for (const rawLevel of courses.map((course) => course.level.trim())) {
      if (!rawLevel || rawLevel.toLowerCase() === "todos") {
        continue;
      }
      const normalized = rawLevel.toLowerCase();
      if (!uniqueLevels.has(normalized)) {
        uniqueLevels.set(normalized, rawLevel);
      }
    }
    return ["Todos", ...Array.from(uniqueLevels.values())];
  }, [courses]);
  const topics = useMemo(() => {
    const uniqueTopics = new Set<CourseTopic>();
    for (const course of courses) {
      uniqueTopics.add(getCourseTopic(course));
    }
    return ["Todos", ...Array.from(uniqueTopics)] as CourseTopicFilter[];
  }, [courses]);
  const ownershipStats = useMemo(() => {
    const owned = courses.filter((course) => paidSet.has(course.id)).length;
    return {
      owned,
      unowned: Math.max(courses.length - owned, 0),
    };
  }, [courses, paidSet]);

  const filtered = useMemo(() => {
    let list = [...courses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q)
      );
    }

    if (selectedOwnership === "Ya los poseo") {
      list = list.filter((c) => paidSet.has(c.id));
    } else if (selectedOwnership === "No los tengo") {
      list = list.filter((c) => !paidSet.has(c.id));
    }

    if (selectedLevel !== "Todos") {
      list = list.filter((c) => c.level === selectedLevel);
    }

    if (selectedTopic !== "Todos") {
      list = list.filter((c) => getCourseTopic(c) === selectedTopic);
    }

    if (selectedCost !== "Todos") {
      list = list.filter((c) => matchesCourseCost(c.priceUsd, selectedCost));
    }

    if (selectedDuration !== "Todas") {
      list = list.filter(
        (c) => getCourseDurationFilter(getCourseDurationHours(c)) === selectedDuration,
      );
    }

    if (sortBy === "menor") {
      list.sort((a, b) => a.priceUsd - b.priceUsd);
    } else if (sortBy === "mayor") {
      list.sort((a, b) => b.priceUsd - a.priceUsd);
    } else {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return list;
  }, [
    courses,
    paidSet,
    searchQuery,
    selectedCost,
    selectedDuration,
    selectedLevel,
    selectedOwnership,
    selectedTopic,
    sortBy,
  ]);

  return (
    <div
      className="min-h-screen pt-24"
      style={{ background: "var(--ui-bg)", color: "var(--ui-text)" }}
    >
      {/* Page header */}
      <div
        className="border-b px-6 py-10"
        style={{ borderColor: "var(--ui-border)", background: "var(--ui-surface-soft)" }}
      >
        <div className="mx-auto max-w-7xl">
          <p className="mb-1 text-sm font-semibold uppercase tracking-widest" style={{ color: "#6366f1" }}>
            Aprende a tu ritmo
          </p>
          <h1 className="text-4xl font-bold" style={{ color: "var(--ui-text)" }}>
            Catálogo de cursos
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--ui-muted)" }}>
            {courses.length} cursos disponibles para llevar tu música al siguiente nivel
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl md:hidden"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          Filtros
        </button>

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"
          } md:relative md:flex md:h-fit md:w-64 md:shrink-0 md:flex-col`}
        >
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="absolute inset-0 bg-black/70 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div
            className={`${
              sidebarOpen
                ? "relative z-10 ml-auto h-full w-72 overflow-y-auto"
                : "w-full"
            } rounded-2xl p-5 md:sticky md:top-28`}
            style={{
              background: "var(--ui-surface)",
              border: "1px solid var(--ui-border)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--ui-text)" }}>
                Filtros
              </h2>
              {sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 md:hidden"
                  style={{ color: "var(--ui-muted)" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Buscar
              </p>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)" }}
              >
                <span style={{ color: "var(--ui-muted)" }}>
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Titulo, instructor o tema"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ui-muted)]"
                  style={{ color: "var(--ui-text)" }}
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Disponibilidad
              </p>
              <div className="flex flex-col gap-1.5">
                {(["Todos", "Ya los poseo", "No los tengo"] as OwnershipFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedOwnership(value)}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium transition-all"
                    style={
                      selectedOwnership === value
                        ? {
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--ui-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--ui-muted)" }}>
                {ownershipStats.owned} desbloqueados · {ownershipStats.unowned} pendientes
              </p>
            </div>

            {/* Level filter */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Dificultad
              </p>
              <div className="flex flex-col gap-1.5">
                {levels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevel(level)}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium transition-all"
                    style={
                      selectedLevel === level
                        ? {
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--ui-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Topico
              </p>
              <div className="flex flex-col gap-1.5">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(topic)}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium transition-all"
                    style={
                      selectedTopic === topic
                        ? {
                            background: "rgba(99,102,241,0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99,102,241,0.3)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--ui-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Costo
              </p>
              <div className="flex flex-col gap-1.5">
                {(["Todos", "Economico", "Medio", "Premium"] as CostFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedCost(value)}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium transition-all"
                    style={
                      selectedCost === value
                        ? {
                            background: "rgba(139,92,246,0.15)",
                            color: "#a78bfa",
                            border: "1px solid rgba(139,92,246,0.3)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--ui-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {value === "Economico"
                      ? "Economico (hasta USD 40)"
                      : value === "Medio"
                        ? "Medio (USD 41 - 70)"
                        : value === "Premium"
                          ? "Premium (mas de USD 70)"
                          : "Todos"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Duracion
              </p>
              <div className="flex flex-col gap-1.5">
                {(["Todas", "Corta", "Media", "Larga"] as DurationFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedDuration(value)}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium transition-all"
                    style={
                      selectedDuration === value
                        ? {
                            background: "rgba(59,130,246,0.15)",
                            color: "#60a5fa",
                            border: "1px solid rgba(59,130,246,0.3)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--ui-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {value === "Corta"
                      ? "Corta (menos de 2.5h)"
                      : value === "Media"
                        ? "Media (2.5h a 3.8h)"
                        : value === "Larga"
                          ? "Larga (mas de 3.8h)"
                          : "Todas"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ui-muted)" }}>
                Ordenar por
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: "reciente", label: "Más reciente" },
                  { value: "menor", label: "Menor precio" },
                  { value: "mayor", label: "Mayor precio" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortBy(opt.value)}
                    className="rounded-xl px-3 py-2 text-left text-sm font-medium transition-all"
                    style={
                      sortBy === opt.value
                        ? {
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--ui-muted)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: "var(--ui-surface)",
                color: "var(--ui-muted)",
              }}
            >
              <span className="font-semibold" style={{ color: "var(--ui-text)" }}>
                {filtered.length}
              </span>{" "}
              resultados encontrados
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedOwnership("Todos");
                setSelectedCost("Todos");
                setSelectedDuration("Todas");
                setSelectedTopic("Todos");
                setSelectedLevel("Todos");
                setSortBy("reciente");
              }}
              className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Active filters */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-sm" style={{ color: "var(--ui-muted)" }}>
              {filtered.length} cursos
            </span>
            {selectedOwnership !== "Todos" && (
              <button
                type="button"
                onClick={() => setSelectedOwnership("Todos")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                }}
              >
                {selectedOwnership} ✕
              </button>
            )}
            {selectedLevel !== "Todos" && (
              <button
                type="button"
                onClick={() => setSelectedLevel("Todos")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#818cf8",
                }}
              >
                {selectedLevel} ✕
              </button>
            )}
            {selectedTopic !== "Todos" && (
              <button
                type="button"
                onClick={() => setSelectedTopic("Todos")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#818cf8",
                }}
              >
                {selectedTopic} ✕
              </button>
            )}
            {selectedCost !== "Todos" && (
              <button
                type="button"
                onClick={() => setSelectedCost("Todos")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  color: "#a78bfa",
                }}
              >
                {selectedCost} ✕
              </button>
            )}
            {selectedDuration !== "Todas" && (
              <button
                type="button"
                onClick={() => setSelectedDuration("Todas")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#60a5fa",
                }}
              >
                {selectedDuration} ✕
              </button>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  color: "#a78bfa",
                }}
              >
                &ldquo;{searchQuery}&rdquo; ✕
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((course) => {
                const isPaid = paidSet.has(course.id);
                const topic = getCourseTopic(course);
                const courseHours = getCourseDurationHours(course);
                const moduleCount = getCourseModuleCount(courseHours);
                return (
                  <div
                    key={course.id}
                    className="ax-tilt group flex flex-col overflow-hidden rounded-2xl"
                    style={{
                      background: "var(--ui-surface-soft)",
                      border: "1px solid var(--ui-border)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <LevelBadge level={course.level} />
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: "rgba(139,92,246,0.18)", color: "#a78bfa" }}
                        >
                          {topic}
                        </span>
                      </div>
                      <h3
                        className="line-clamp-2 text-sm font-semibold leading-snug"
                        style={{ color: "var(--ui-text)" }}
                      >
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--ui-muted)" }}>
                        {course.instructor}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: "var(--ui-muted)" }}>
                        <span className="flex items-center gap-1">
                          <BookIcon />
                          {moduleCount} modulos
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon />
                          {courseHours.toFixed(1)}h
                        </span>
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between">
                          {isPaid ? (
                            <span
                              className="flex items-center gap-1 text-sm font-bold"
                              style={{ color: "#34d399" }}
                            >
                              ✓ Pagado
                            </span>
                          ) : (
                            <span className="text-lg font-bold" style={{ color: "var(--ui-text)" }}>
                              USD {course.priceUsd.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/academiax/courses/${course.id}`}
                          onClick={(event) => handleOpenCourse(event, course.id)}
                          aria-disabled={isNavigating && openingCourseId === course.id}
                          className={`mt-3 flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 ${
                            isNavigating && openingCourseId === course.id ? "pointer-events-none opacity-85" : ""
                          }`}
                          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                        >
                          {isNavigating && openingCourseId === course.id ? "Cargando..." : "Ver curso"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-3xl py-24 text-center"
              style={{
                background: "var(--ui-surface-soft)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(99,102,241,0.1)" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--ui-text)" }}>
                No se encontraron cursos
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--ui-muted)" }}>
                Prueba con otros términos de búsqueda o ajusta los filtros.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedOwnership("Todos");
                  setSelectedCost("Todos");
                  setSelectedDuration("Todas");
                  setSelectedTopic("Todos");
                  setSelectedLevel("Todos");
                  setSortBy("reciente");
                }}
                className="mt-6 rounded-2xl px-6 py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
