"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { updateProfileSchema } from "@/lib/validations/profile";

type ProfileMenuProps = {
  userName: string;
  userEmail: string;
  userAvatarUrl: string;
  userBio: string;
  userMusicianType: string;
  userPrimaryInstrument: string;
  userOrientation: string;
  userStudies: string;
};

type ApiPayload = {
  message?: string;
  errors?: {
    name?: string[];
    bio?: string[];
    musicianType?: string[];
    primaryInstrument?: string[];
    orientation?: string[];
    studies?: string[];
  };
};

const MUSICIAN_TYPES = [
  { value: "", label: "Sin especificar" },
  { value: "Solista", label: "Solista" },
  { value: "Banda", label: "Banda" },
  { value: "Productor", label: "Productor / Beatmaker" },
  { value: "DJ", label: "DJ" },
  { value: "Compositor", label: "Compositor / Arreglista" },
  { value: "Docente", label: "Docente musical" },
  { value: "Tecnico", label: "Tecnico de sonido" },
  { value: "Otro", label: "Otro" },
];

const ORIENTATIONS = [
  { value: "", label: "Sin especificar" },
  { value: "Busco banda", label: "Busco banda" },
  { value: "Busco colaborar", label: "Busco colaborar" },
  { value: "Busco musicos para proyecto", label: "Busco musicos para proyecto" },
  { value: "Disponible para booking", label: "Disponible para booking" },
  { value: "Solo compartir", label: "Solo compartir" },
];

export function ProfileMenu({
  userName = "Usuario",
  userEmail = "",
  userAvatarUrl = "",
  userBio = "",
  userMusicianType = "",
  userPrimaryInstrument = "",
  userOrientation = "",
  userStudies = "",
}: ProfileMenuProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(userName);
  const [bio, setBio] = useState(userBio);
  const [musicianType, setMusicianType] = useState(userMusicianType);
  const [primaryInstrument, setPrimaryInstrument] = useState(userPrimaryInstrument);
  const [orientation, setOrientation] = useState(userOrientation);
  const [studies, setStudies] = useState(userStudies);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initials = useMemo(() => {
    const safeName = typeof userName === "string" ? userName : "Usuario";
    const tokens = safeName.trim().split(/\s+/).filter(Boolean);

    if (tokens.length === 0) {
      return "MU";
    }

    return tokens
      .slice(0, 2)
      .map((token) => token.charAt(0).toUpperCase())
      .join("");
  }, [userName]);

  const normalizedAvatarUrl = userAvatarUrl.trim();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const clearFeedback = () => {
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = updateProfileSchema.safeParse({
      name,
      bio,
      musicianType,
      primaryInstrument,
      orientation,
      studies,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError =
        fieldErrors.name?.[0] ??
        fieldErrors.bio?.[0] ??
        fieldErrors.musicianType?.[0] ??
        fieldErrors.primaryInstrument?.[0] ??
        fieldErrors.orientation?.[0] ??
        fieldErrors.studies?.[0] ??
        "Revisa los campos del formulario.";
      setError(firstError);
      return;
    }

    setIsSaving(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;

    setIsSaving(false);

    if (!response.ok) {
      const fieldErrors = payload?.errors;
      const firstError =
        fieldErrors?.name?.[0] ??
        fieldErrors?.bio?.[0] ??
        fieldErrors?.musicianType?.[0] ??
        fieldErrors?.primaryInstrument?.[0] ??
        fieldErrors?.orientation?.[0] ??
        fieldErrors?.studies?.[0] ??
        payload?.message ??
        "No se pudo actualizar el perfil.";
      setError(firstError);
      return;
    }

    setSuccess(payload?.message ?? "Perfil actualizado.");
    router.refresh();
  };

  return (
    <div ref={panelRef} className="relative z-[70]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rh-icon-button inline-flex items-center gap-3 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-left text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
      >
        <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-on-primary)]">
            {initials}
          </span>
          {normalizedAvatarUrl ? (
            <span
              className="relative z-10 h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${normalizedAvatarUrl})` }}
            />
          ) : null}
        </span>
        <span className="hidden text-sm font-semibold sm:inline">Perfil</span>
      </button>

      {isOpen ? (
        <div className="slide-in backdrop-panel rh-card absolute right-0 z-[90] mt-3 w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-2xl shadow-[color:rgb(var(--ui-glow-primary)/0.2)] sm:w-96 sm:p-5">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
              <span className="absolute inset-0 flex items-center justify-center bg-[var(--ui-primary)] text-base font-bold text-[var(--ui-on-primary)]">
                {initials}
              </span>
              {normalizedAvatarUrl ? (
                <span
                  className="relative z-10 h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${normalizedAvatarUrl})` }}
                />
              ) : null}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--ui-text)]">{userName}</p>
              <p className="text-xs text-[var(--ui-muted)]">{userEmail}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-[var(--ui-text)]">Editar perfil</h3>
          <p className="mt-0.5 text-xs text-[var(--ui-muted)]">
            Personaliza tu perfil publico de artista.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* Nombre */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                Nombre artístico
              </span>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); clearFeedback(); }}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
                placeholder="Tu nombre o alias"
              />
            </label>

            {/* Bio */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                Bio
              </span>
              <textarea
                value={bio}
                onChange={(e) => { setBio(e.target.value); clearFeedback(); }}
                rows={3}
                maxLength={300}
                className="rh-input w-full resize-none rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
                placeholder="Cuéntale algo a la comunidad sobre ti…"
              />
              <span className="block text-right text-xs text-[var(--ui-muted)]">
                {bio.length}/300
              </span>
            </label>

            {/* Tipo de músico */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                Tipo de músico
              </span>
              <select
                value={musicianType}
                onChange={(e) => { setMusicianType(e.target.value); clearFeedback(); }}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
              >
                {MUSICIAN_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Instrumento principal */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                Instrumento principal
              </span>
              <input
                value={primaryInstrument}
                onChange={(e) => { setPrimaryInstrument(e.target.value); clearFeedback(); }}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
                placeholder="Ej: Guitarra, Piano, Producción…"
              />
            </label>

            {/* Orientación */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                Estoy buscando…
              </span>
              <select
                value={orientation}
                onChange={(e) => { setOrientation(e.target.value); clearFeedback(); }}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
              >
                {ORIENTATIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Estudios */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
                Formación musical
              </span>
              <input
                value={studies}
                onChange={(e) => { setStudies(e.target.value); clearFeedback(); }}
                className="rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-4 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
                placeholder="Ej: Conservatorio, Autodidacta, UASD…"
              />
            </label>

            {error ? (
              <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2 text-sm text-[var(--ui-danger)]">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-3 py-2 text-sm text-[var(--ui-accent)]">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="rh-btn-primary inline-flex w-full items-center justify-center rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
