"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type LessonType = "video" | "reading" | "practice";

type EditableCourse = {
  id: string;
  title: string;
  instructor: string;
  level: string;
  imageUrl: string;
  summary: string;
  priceUsd: number;
};

type EditableModule = {
  id: string;
  position: number;
  title: string;
  lessonType: LessonType;
  durationMinutes: number;
  content: string;
  videoUrl: string;
};

type Props = {
  mode: "create" | "edit";
  initialCourse: EditableCourse | null;
  initialModules: EditableModule[];
};

type ModuleDraft = {
  title: string;
  lessonType: LessonType;
  durationMinutes: string;
  content: string;
  videoUrl: string;
};

const emptyModuleDraft: ModuleDraft = {
  title: "",
  lessonType: "video",
  durationMinutes: "12",
  content: "",
  videoUrl: "",
};

export function CourseAdminEditor({ mode, initialCourse, initialModules }: Props) {
  const router = useRouter();
  const [course, setCourse] = useState<EditableCourse | null>(initialCourse);
  const [courseForm, setCourseForm] = useState({
    title: initialCourse?.title ?? "",
    instructor: initialCourse?.instructor ?? "Admin",
    level: initialCourse?.level ?? "Intermedio",
    imageUrl:
      initialCourse?.imageUrl ??
      "https://source.unsplash.com/900x600/?music,course",
    summary: initialCourse?.summary ?? "",
    priceUsd: initialCourse ? String(initialCourse.priceUsd) : "0",
  });
  const [modules, setModules] = useState<EditableModule[]>(
    [...initialModules].sort((a, b) => a.position - b.position),
  );
  const [moduleDraft, setModuleDraft] = useState<ModuleDraft>(emptyModuleDraft);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [updatingModuleId, setUpdatingModuleId] = useState<string | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const canManageModules = Boolean(course?.id);

  const pageTitle = mode === "create" && !course ? "Crear curso" : "Editar curso";

  const summaryStats = useMemo(() => {
    const totalDuration = modules.reduce((sum, module) => sum + module.durationMinutes, 0);
    const videoCount = modules.filter((module) => module.lessonType === "video").length;
    const readingCount = modules.filter((module) => module.lessonType === "reading").length;
    const practiceCount = modules.filter((module) => module.lessonType === "practice").length;
    return {
      totalDuration,
      videoCount,
      readingCount,
      practiceCount,
    };
  }, [modules]);

  const clearFeedback = () => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
  };

  const createCourse = async () => {
    clearFeedback();

    const title = courseForm.title.trim();
    const summary = courseForm.summary.trim();
    const instructor = courseForm.instructor.trim() || "Admin";
    const level = courseForm.level.trim() || "Intermedio";
    const imageUrl =
      courseForm.imageUrl.trim() ||
      "https://source.unsplash.com/900x600/?music,course";
    const priceUsd = Number(courseForm.priceUsd);

    if (!title || !summary) {
      setFeedbackError("Titulo y descripcion son requeridos.");
      return;
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      setFeedbackError("El precio del curso es invalido.");
      return;
    }

    setIsSavingCourse(true);
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          instructor,
          level,
          imageUrl,
          priceUsd,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; course?: EditableCourse }
        | null;

      if (!response.ok || !payload?.course) {
        setFeedbackError(payload?.message ?? "No se pudo crear el curso.");
        return;
      }

      setFeedbackSuccess("Curso creado. Ahora puedes agregar modulos y videos.");
      setCourse(payload.course);
      router.replace(`/academiax/courses/${payload.course.id}/edit`);
      router.refresh();
    } catch {
      setFeedbackError("No se pudo crear el curso.");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const saveCourse = async () => {
    if (!course) {
      return;
    }

    clearFeedback();

    const title = courseForm.title.trim();
    const summary = courseForm.summary.trim();
    const instructor = courseForm.instructor.trim() || "Admin";
    const level = courseForm.level.trim() || "Intermedio";
    const imageUrl =
      courseForm.imageUrl.trim() ||
      "https://source.unsplash.com/900x600/?music,course";
    const priceUsd = Number(courseForm.priceUsd);

    if (!title || !summary) {
      setFeedbackError("Titulo y descripcion son requeridos.");
      return;
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      setFeedbackError("El precio del curso es invalido.");
      return;
    }

    setIsSavingCourse(true);
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          instructor,
          level,
          imageUrl,
          priceUsd,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; course?: EditableCourse }
        | null;

      if (!response.ok || !payload?.course) {
        setFeedbackError(payload?.message ?? "No se pudo actualizar el curso.");
        return;
      }

      setCourse(payload.course);
      setFeedbackSuccess("Curso actualizado.");
      router.refresh();
    } catch {
      setFeedbackError("No se pudo actualizar el curso.");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const addModule = async () => {
    if (!course) {
      return;
    }

    clearFeedback();

    const title = moduleDraft.title.trim();
    const content = moduleDraft.content.trim();
    const durationMinutes = Number(moduleDraft.durationMinutes);

    if (!title || !content) {
      setFeedbackError("Titulo y contenido del modulo son requeridos.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setFeedbackError("La duracion del modulo es invalida.");
      return;
    }

    setIsCreatingModule(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lessonType: moduleDraft.lessonType,
          durationMinutes,
          content,
          videoUrl: moduleDraft.videoUrl.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; module?: EditableModule }
        | null;
      const createdModule = payload?.module;

      if (!response.ok || !createdModule) {
        setFeedbackError(payload?.message ?? "No se pudo crear el modulo.");
        return;
      }

      setModules((prev) => [...prev, createdModule].sort((a, b) => a.position - b.position));
      setModuleDraft(emptyModuleDraft);
      setFeedbackSuccess("Modulo creado.");
    } catch {
      setFeedbackError("No se pudo crear el modulo.");
    } finally {
      setIsCreatingModule(false);
    }
  };

  const updateModuleDraftField = <K extends keyof ModuleDraft>(key: K, value: ModuleDraft[K]) => {
    setModuleDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateModuleField = <K extends keyof EditableModule>(
    moduleId: string,
    key: K,
    value: EditableModule[K],
  ) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId ? { ...module, [key]: value } : module,
      ),
    );
  };

  const saveModule = async (module: EditableModule) => {
    if (!course) {
      return;
    }

    clearFeedback();

    const title = module.title.trim();
    const content = module.content.trim();
    const durationMinutes = Number(module.durationMinutes);

    if (!title || !content) {
      setFeedbackError("Titulo y contenido del modulo son requeridos.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setFeedbackError("La duracion del modulo es invalida.");
      return;
    }

    setUpdatingModuleId(module.id);
    try {
      const response = await fetch(`/api/courses/${course.id}/modules/${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lessonType: module.lessonType,
          durationMinutes,
          content,
          videoUrl: module.videoUrl.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; module?: EditableModule }
        | null;

      if (!response.ok || !payload?.module) {
        setFeedbackError(payload?.message ?? "No se pudo actualizar el modulo.");
        return;
      }

      setModules((prev) =>
        prev
          .map((item) => (item.id === payload.module?.id ? payload.module : item))
          .sort((a, b) => a.position - b.position),
      );
      setFeedbackSuccess("Modulo actualizado.");
    } catch {
      setFeedbackError("No se pudo actualizar el modulo.");
    } finally {
      setUpdatingModuleId(null);
    }
  };

  const removeModule = async (moduleId: string) => {
    if (!course) {
      return;
    }

    clearFeedback();
    setDeletingModuleId(moduleId);
    try {
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedbackError(payload?.message ?? "No se pudo eliminar el modulo.");
        return;
      }

      setModules((prev) =>
        prev
          .filter((module) => module.id !== moduleId)
          .map((module, index) => ({ ...module, position: index + 1 })),
      );
      setFeedbackSuccess("Modulo eliminado.");
    } catch {
      setFeedbackError("No se pudo eliminar el modulo.");
    } finally {
      setDeletingModuleId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] px-4 pb-6 pt-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-muted)]">
              Panel de cursos
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--ui-text)]">{pageTitle}</h1>
            <p className="mt-1 text-sm text-[var(--ui-muted)]">
              Diseña tu curso, agrega módulos y enlaza videos para tus estudiantes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard?s=courses"
              className="rounded-xl border border-[color:var(--ui-border)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]"
            >
              Volver al panel
            </Link>
            {course ? (
              <Link
                href={`/academiax/courses/${course.id}`}
                className="rounded-xl bg-[var(--ui-primary)] px-3 py-2 text-sm font-semibold text-[var(--ui-on-primary)] hover:opacity-90"
              >
                Ver curso público
              </Link>
            ) : null}
          </div>
        </header>

        {feedbackError ? (
          <p className="rounded-2xl bg-[color:rgb(var(--ui-glow-danger)/0.12)] px-4 py-3 text-sm text-[var(--ui-danger)]">
            {feedbackError}
          </p>
        ) : null}
        {feedbackSuccess ? (
          <p className="rounded-2xl bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-4 py-3 text-sm text-[var(--ui-accent)]">
            {feedbackSuccess}
          </p>
        ) : null}

        <section className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-5">
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Información general</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Título</span>
              <input
                value={courseForm.title}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Instructor</span>
              <input
                value={courseForm.instructor}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, instructor: event.target.value }))}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Nivel</span>
              <select
                value={courseForm.level}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, level: event.target.value }))}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
              >
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Precio USD</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={courseForm.priceUsd}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, priceUsd: event.target.value }))}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Imagen URL</span>
              <input
                value={courseForm.imageUrl}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Resumen</span>
              <textarea
                rows={4}
                value={courseForm.summary}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, summary: event.target.value }))}
                className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={isSavingCourse}
              onClick={() => void (course ? saveCourse() : createCourse())}
              className="rounded-xl bg-[var(--ui-primary)] px-5 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:opacity-90 disabled:opacity-60"
            >
              {isSavingCourse
                ? course
                  ? "Guardando..."
                  : "Creando..."
                : course
                  ? "Guardar cambios"
                  : "Crear curso"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ui-text)]">Módulos del curso</h2>
              <p className="mt-1 text-sm text-[var(--ui-muted)]">
                Organiza tu curso en lecciones con contenido y video.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--ui-muted)]">
              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1">{modules.length} módulos</span>
              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1">{summaryStats.totalDuration} min</span>
              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1">{summaryStats.videoCount} videos</span>
              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1">{summaryStats.readingCount} lecturas</span>
              <span className="rounded-full border border-[color:var(--ui-border)] px-3 py-1">{summaryStats.practiceCount} prácticas</span>
            </div>
          </div>

          {!canManageModules ? (
            <p className="mt-4 rounded-xl bg-[var(--ui-surface-soft)] px-4 py-3 text-sm text-[var(--ui-muted)]">
              Primero crea el curso para habilitar la gestión de módulos.
            </p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4 sm:grid-cols-2">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Título del módulo</span>
                  <input
                    value={moduleDraft.title}
                    onChange={(event) => updateModuleDraftField("title", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Tipo de lección</span>
                  <select
                    value={moduleDraft.lessonType}
                    onChange={(event) =>
                      updateModuleDraftField("lessonType", event.target.value as LessonType)
                    }
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  >
                    <option value="video">Video</option>
                    <option value="reading">Lectura</option>
                    <option value="practice">Práctica</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Duración (min)</span>
                  <input
                    type="number"
                    min="1"
                    value={moduleDraft.durationMinutes}
                    onChange={(event) => updateModuleDraftField("durationMinutes", event.target.value)}
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Contenido</span>
                  <textarea
                    rows={3}
                    value={moduleDraft.content}
                    onChange={(event) => updateModuleDraftField("content", event.target.value)}
                    className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">URL de video (opcional)</span>
                  <input
                    value={moduleDraft.videoUrl}
                    onChange={(event) => updateModuleDraftField("videoUrl", event.target.value)}
                    placeholder="https://youtube.com/..."
                    className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                  />
                </label>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isCreatingModule}
                    onClick={() => void addModule()}
                    className="rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] hover:opacity-90 disabled:opacity-55"
                  >
                    {isCreatingModule ? "Agregando..." : "Agregar módulo"}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {modules.length === 0 ? (
                  <p className="rounded-xl bg-[var(--ui-surface-soft)] px-4 py-3 text-sm text-[var(--ui-muted)]">
                    Este curso todavía no tiene módulos.
                  </p>
                ) : (
                  modules
                    .sort((a, b) => a.position - b.position)
                    .map((module) => (
                      <article
                        key={module.id}
                        className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                          Módulo {module.position}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Título</span>
                            <input
                              value={module.title}
                              onChange={(event) =>
                                updateModuleField(module.id, "title", event.target.value)
                              }
                              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Tipo</span>
                            <select
                              value={module.lessonType}
                              onChange={(event) =>
                                updateModuleField(module.id, "lessonType", event.target.value as LessonType)
                              }
                              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                            >
                              <option value="video">Video</option>
                              <option value="reading">Lectura</option>
                              <option value="practice">Práctica</option>
                            </select>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Duración</span>
                            <input
                              type="number"
                              min="1"
                              value={String(module.durationMinutes)}
                              onChange={(event) =>
                                updateModuleField(
                                  module.id,
                                  "durationMinutes",
                                  Number(event.target.value) || 0,
                                )
                              }
                              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                            />
                          </label>
                          <label className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Contenido</span>
                            <textarea
                              rows={3}
                              value={module.content}
                              onChange={(event) =>
                                updateModuleField(module.id, "content", event.target.value)
                              }
                              className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                            />
                          </label>
                          <label className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">URL de video</span>
                            <input
                              value={module.videoUrl}
                              onChange={(event) =>
                                updateModuleField(module.id, "videoUrl", event.target.value)
                              }
                              className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none"
                            />
                          </label>
                        </div>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void removeModule(module.id)}
                            disabled={deletingModuleId === module.id || updatingModuleId === module.id}
                            className="rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.35)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-3 py-2 text-xs font-semibold text-[var(--ui-danger)] hover:bg-[color:rgb(var(--ui-glow-danger)/0.15)] disabled:opacity-55"
                          >
                            {deletingModuleId === module.id ? "Eliminando..." : "Eliminar módulo"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveModule(module)}
                            disabled={updatingModuleId === module.id || deletingModuleId === module.id}
                            className="rounded-xl bg-[var(--ui-primary)] px-3 py-2 text-xs font-semibold text-[var(--ui-on-primary)] hover:opacity-90 disabled:opacity-55"
                          >
                            {updatingModuleId === module.id ? "Guardando..." : "Guardar módulo"}
                          </button>
                        </div>
                      </article>
                    ))
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
