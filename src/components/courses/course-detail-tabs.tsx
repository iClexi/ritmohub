"use client";

import { useState } from "react";
import Link from "next/link";

type Module = {
  id: string;
  position: number;
  title: string;
  lessonType: "video" | "reading" | "practice";
  durationMinutes: number;
  content: string;
  videoUrl: string;
};

type InstructorUser = {
  id: string;
  name: string;
  bio: string;
  primaryInstrument: string;
  studies: string;
};

type Props = {
  modules: Module[];
  whatYouLearn: string[];
  instructor: string;
  instructorUser: InstructorUser | null;
};

export function CourseDetailTabs({ modules, whatYouLearn, instructor, instructorUser }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "instructor">("overview");

  const tabs = [
    { key: "overview" as const, label: "Vista general" },
    { key: "content" as const, label: "Contenido" },
    { key: "instructor" as const, label: "Instructor" },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div
        className="mb-8 flex gap-1 rounded-2xl p-1"
        style={{
          background: "var(--ui-surface-soft)",
          border: "1px solid var(--ui-border)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
            style={
              activeTab === tab.key
                ? {
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  }
                : { color: "var(--ui-muted)", background: "transparent" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Vista general */}
      {activeTab === "overview" && (
        <div>
          <h2 className="mb-5 text-xl font-bold" style={{ color: "var(--ui-text)" }}>
            Lo que aprenderás
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {whatYouLearn.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  background: "rgba(99,102,241,0.05)",
                  border: "1px solid rgba(99,102,241,0.12)",
                }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  ✓
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ui-text)" }}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--ui-text)" }}>
              Para quién es este curso
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>
              Este curso está diseñado para músicos en todos los niveles que quieran llevar sus
              habilidades al siguiente nivel. Ya sea que estés comenzando tu camino musical o
              busques perfeccionar técnicas avanzadas, encontrarás contenido valioso y aplicable
              a tu práctica diaria.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Contenido */}
      {activeTab === "content" && (
        <div>
          <h2 className="mb-5 text-xl font-bold" style={{ color: "var(--ui-text)" }}>
            Topicos del curso
          </h2>
          {modules.length > 0 ? (
            <div
              className="grid gap-3"
              style={{ border: "1px solid var(--ui-border)" }}
            >
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "var(--ui-surface-soft)",
                    borderBottom: "1px solid var(--ui-border)",
                  }}
                >
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                  >
                    {module.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--ui-text)" }}>
                      {module.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--ui-muted)" }}>
                      Topico {module.position}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--ui-muted)" }}>
              No hay topicos disponibles aun.
            </p>
          )}
        </div>
      )}

      {/* Tab: Instructor */}
      {activeTab === "instructor" && (
        <div>
          <h2 className="mb-5 text-xl font-bold" style={{ color: "var(--ui-text)" }}>
            Tu instructor
          </h2>
          {instructorUser ? (
            <div
              className="rounded-3xl p-6"
              style={{
                background: "var(--ui-surface-soft)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <div className="flex items-start gap-5">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  {instructorUser.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <Link
                    href={`/artist/${instructorUser.id}`}
                    className="text-lg font-bold hover:underline"
                    style={{ color: "var(--ui-text)" }}
                  >
                    {instructorUser.name}
                  </Link>
                  <p className="text-sm font-medium" style={{ color: "#818cf8" }}>
                    Instructor certificado
                  </p>
                  {instructorUser.primaryInstrument && (
                    <p className="mt-1 text-xs" style={{ color: "var(--ui-muted)" }}>
                      {instructorUser.primaryInstrument}
                      {instructorUser.studies ? ` · ${instructorUser.studies}` : ""}
                    </p>
                  )}
                </div>
              </div>

              {instructorUser.bio && (
                <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>
                  {instructorUser.bio}
                </p>
              )}

              {/* Fake stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: "Estudiantes", value: "2.4K+" },
                  { label: "Cursos", value: "12" },
                  { label: "Calificación", value: "4.9 ★" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-lg font-bold" style={{ color: "var(--ui-text)" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ui-muted)" }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-3xl p-6"
              style={{
                background: "var(--ui-surface-soft)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  {instructor.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-base font-bold" style={{ color: "var(--ui-text)" }}>
                    {instructor}
                  </p>
                  <p className="text-sm" style={{ color: "#818cf8" }}>
                    Instructor certificado
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
