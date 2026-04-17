"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Module = {
  id: string;
  courseId: string;
  position: number;
  title: string;
  lessonType: "video" | "reading" | "practice";
  durationMinutes: number;
  content: string;
  videoUrl: string;
  createdAt: string;
};

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
  course: Course;
  modules: Module[];
};

const LESSON_LABEL: Record<Module["lessonType"], string> = {
  video: "Video",
  reading: "Lectura",
  practice: "Práctica",
};

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className ?? "h-4 w-4"} stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function ReadingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className ?? "h-4 w-4"} stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function PracticeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className ?? "h-4 w-4"} stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function LessonIcon({ type, className }: { type: Module["lessonType"]; className?: string }) {
  if (type === "video") return <VideoIcon className={className} />;
  if (type === "reading") return <ReadingIcon className={className} />;
  return <PracticeIcon className={className} />;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (!match) return null;
  return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
}

const LESSON_TYPE_STYLE: Record<Module["lessonType"], { bg: string; color: string }> = {
  video: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  reading: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  practice: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
};

export function CoursePlayer({ course, modules }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set();
    }

    try {
      const stored = localStorage.getItem(`ax-completed-${course.id}`);
      if (!stored) {
        return new Set();
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return new Set();
      }

      return new Set(parsed.filter((value): value is string => typeof value === "string"));
    } catch {
      return new Set();
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesByModule, setNotesByModule] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const initial: Record<string, string> = {};
    for (const moduleItem of modules) {
      try {
        const stored = localStorage.getItem(`ax-note-${course.id}-${moduleItem.id}`);
        if (stored) {
          initial[moduleItem.id] = stored;
        }
      } catch {
        // ignore storage errors
      }
    }

    return initial;
  });

  const activeModule = modules[activeIndex];
  const progressPct =
    modules.length > 0 ? Math.round((completed.size / modules.length) * 100) : 0;

  const persistCompleted = useCallback(
    (next: Set<string>) => {
      try {
        localStorage.setItem(`ax-completed-${course.id}`, JSON.stringify([...next]));
      } catch {
        // ignore
      }
    },
    [course.id]
  );

  const note = activeModule ? notesByModule[activeModule.id] ?? "" : "";

  const saveNote = (value: string) => {
    if (!activeModule) return;

    setNotesByModule((prev) => ({
      ...prev,
      [activeModule.id]: value,
    }));

    try {
      localStorage.setItem(`ax-note-${course.id}-${activeModule.id}`, value);
    } catch {
      // ignore
    }
  };

  const toggleCompleted = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistCompleted(next);
      return next;
    });
  };

  const embedUrl = activeModule?.videoUrl ? getYouTubeEmbedUrl(activeModule.videoUrl) : null;

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: "#07070f", color: "#f0f4ff" }}
    >
      {/* Top progress bar */}
      <div
        className="relative h-[3px] w-full shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)",
          }}
        />
      </div>

      {/* Top nav bar */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,7,15,0.95)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors md:hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" style={{ color: "#94a3b8" }}>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          <Link
            href={`/academiax/courses/${course.id}`}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
            style={{ color: "#94a3b8" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">{course.title}</span>
            <span className="sm:hidden">Atrás</span>
          </Link>
        </div>

        {/* Center: lesson title */}
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold" style={{ color: "#f0f4ff" }}>
            {activeModule?.title}
          </p>
          {activeModule && (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Lección {activeModule.position} de {modules.length}
            </p>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((i) => i - 1)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <button
            type="button"
            disabled={activeIndex === modules.length - 1}
            onClick={() => setActiveIndex((i) => i + 1)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8",
            }}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/70 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen
              ? "fixed inset-y-0 left-0 z-40 flex w-72 flex-col"
              : "hidden md:flex md:w-72 md:flex-col"
          } shrink-0 overflow-hidden`}
          style={{
            background: "#0d0d1a",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Course header */}
          <div
            className="p-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6366f1" }}>
              {course.level}
            </p>
            <h2 className="mt-1 text-sm font-bold leading-snug" style={{ color: "#f0f4ff" }}>
              {course.title}
            </h2>
            <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
              {course.instructor}
            </p>

            {/* Progress */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span style={{ color: "#94a3b8" }}>
                  {completed.size}/{modules.length} lecciones
                </span>
                <span style={{ color: "#818cf8" }}>{progressPct}%</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Module list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {modules.map((module, i) => {
              const isActive = i === activeIndex;
              const isDone = completed.has(module.id);
              const style = LESSON_TYPE_STYLE[module.lessonType];
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(i);
                    setSidebarOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left transition-all"
                  style={{
                    borderLeft: isActive
                      ? "2px solid #6366f1"
                      : "2px solid transparent",
                    background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Status circle */}
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={
                        isDone
                          ? { background: "#10b981", color: "white" }
                          : isActive
                          ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }
                          : { background: "rgba(255,255,255,0.06)", color: "#94a3b8" }
                      }
                    >
                      {isDone ? "✓" : module.position}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs font-semibold"
                        style={{ color: isActive ? "#818cf8" : "#f0f4ff" }}
                      >
                        {module.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span style={{ color: style.color }}>
                          <LessonIcon type={module.lessonType} className="h-3 w-3" />
                        </span>
                        <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                          {LESSON_LABEL[module.lessonType]}
                        </span>
                        <span
                          className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
                        >
                          {module.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
            {activeModule ? (
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Lesson type badge */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const s = LESSON_TYPE_STYLE[activeModule.lessonType];
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: s.bg, color: s.color }}
                      >
                        <LessonIcon type={activeModule.lessonType} className="h-3.5 w-3.5" />
                        {LESSON_LABEL[activeModule.lessonType]}
                      </span>
                    );
                  })()}
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {activeModule.durationMinutes} min estimados
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold" style={{ color: "#f0f4ff" }}>
                  {activeModule.title}
                </h1>

                {/* Video embed */}
                {embedUrl && (
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{
                      boxShadow: "0 24px 48px -8px rgba(99,102,241,0.25)",
                    }}
                  >
                    <div className="relative pb-[56.25%] bg-black">
                      <iframe
                        src={embedUrl}
                        title={activeModule.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Lesson content */}
                {activeModule.content && (
                  <div
                    className="rounded-2xl p-6 text-sm leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#94a3b8",
                    }}
                  >
                    {activeModule.content}
                  </div>
                )}

                {/* Notes section */}
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setNotesOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      color: "#f0f4ff",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                      >
                        📝
                      </span>
                      <span className="text-sm font-semibold">Mis notas</span>
                      {note && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                        >
                          Guardado
                        </span>
                      )}
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 transition-transform"
                      style={{
                        transform: notesOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: "#94a3b8",
                      }}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {notesOpen && (
                    <div
                      className="p-4"
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <textarea
                        value={note}
                        onChange={(e) => saveNote(e.target.value)}
                        placeholder="Escribe tus notas aquí... Se guardan automáticamente en tu dispositivo."
                        rows={5}
                        className="w-full resize-y rounded-xl bg-transparent p-3 text-sm outline-none placeholder:text-[#94a3b8]"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#f0f4ff",
                        }}
                      />
                      <p className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
                        Las notas se guardan localmente en tu navegador.
                      </p>
                    </div>
                  )}
                </div>

                {/* Mark complete + next */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCompleted(activeModule.id)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                    style={
                      completed.has(activeModule.id)
                        ? {
                            background: "rgba(16,185,129,0.15)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            color: "#34d399",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#94a3b8",
                          }
                    }
                  >
                    {completed.has(activeModule.id) ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Completado
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        Marcar como completado
                      </>
                    )}
                  </button>

                  {activeIndex < modules.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!completed.has(activeModule.id)) {
                          toggleCompleted(activeModule.id);
                        }
                        setActiveIndex((i) => i + 1);
                      }}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                    >
                      Siguiente lección
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={`/academiax/courses/${course.id}`}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                    >
                      Finalizar curso 🎉
                    </Link>
                  )}
                </div>

                {/* Mobile module nav */}
                <div className="block md:hidden">
                  <p
                    className="mb-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#94a3b8" }}
                  >
                    Todas las lecciones
                  </p>
                  <div className="space-y-1">
                    {modules.map((module, i) => (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all"
                        style={
                          i === activeIndex
                            ? {
                                background: "rgba(99,102,241,0.1)",
                                border: "1px solid rgba(99,102,241,0.2)",
                                color: "#818cf8",
                              }
                            : {
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid transparent",
                                color: "#94a3b8",
                              }
                        }
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={
                            completed.has(module.id)
                              ? { background: "#10b981", color: "white" }
                              : { background: "rgba(255,255,255,0.08)", color: "#94a3b8" }
                          }
                        >
                          {completed.has(module.id) ? "✓" : module.position}
                        </span>
                        <span className="flex-1 truncate">{module.title}</span>
                        <span className="text-xs" style={{ color: "#94a3b8" }}>
                          {module.durationMinutes}m
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex h-full items-center justify-center text-sm"
                style={{ color: "#94a3b8" }}
              >
                No hay lecciones disponibles.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
