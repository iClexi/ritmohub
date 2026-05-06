"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { type CountryIso2, PhoneInput } from "react-international-phone";
import { useRouter } from "next/navigation";
import { updateProfileSchema } from "@/lib/validations/profile";
import { avatarUploadSchema } from "@/lib/validations/workspace";
import {
  validateField,
  nameRules,
  locationRules,
  handleRules,
  optionalUrlRules,
  instrumentRules,
  type FieldRule,
} from "@/lib/validations/rules";

const DEFAULT_PHONE_COUNTRY: CountryIso2 = "do";
const phoneControlKeys = new Set(["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"]);

function preventNonNumericPhoneInput(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (phoneControlKeys.has(event.key)) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
}

type ProfileEditorProps = {
  userId: string;
  userName: string;
  userEmail: string;
  userBio: string;
  userMusicianType: string;
  userPrimaryInstrument: string;
  userOrientation: string;
  userStudies: string;
  userAvatarUrl?: string;
  userCoverUrl?: string;
  userWebsiteUrl?: string;
  userLocation?: string;
  userSocialInstagram?: string;
  userSocialSpotify?: string;
  userSocialYoutube?: string;
  userStageName?: string;
  userGenre?: string;
  userTagline?: string;
  userPhone?: string;
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

function getInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((t) => t[0]?.toUpperCase()).join("") || "MU";
}

function splitNameParts(fullName: string) {
  const normalized = fullName.trim().replaceAll(/\s+/g, " ");
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

export function ProfileEditor({
  userId,
  userName = "Usuario",
  userEmail = "",
  userBio = "",
  userMusicianType = "",
  userPrimaryInstrument = "",
  userOrientation = "",
  userStudies = "",
  userAvatarUrl = "",
  userCoverUrl = "",
  userWebsiteUrl = "",
  userLocation = "",
  userSocialInstagram = "",
  userSocialSpotify = "",
  userSocialYoutube = "",
  userStageName = "",
  userGenre = "",
  userTagline = "",
  userPhone = "",
}: ProfileEditorProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const initialNameParts = splitNameParts(userName);
  const [firstName, setFirstName] = useState(initialNameParts.firstName);
  const [lastName, setLastName] = useState(initialNameParts.lastName);
  const [bio, setBio] = useState(userBio);
  const [musicianType, setMusicianType] = useState(userMusicianType);
  const [primaryInstrument, setPrimaryInstrument] = useState(userPrimaryInstrument);
  const [orientation, setOrientation] = useState(userOrientation);
  const [studies, setStudies] = useState(userStudies);
  const [avatarUrl, setAvatarUrl] = useState(userAvatarUrl);
  const [coverUrl, setCoverUrl] = useState(userCoverUrl);
  const [websiteUrl, setWebsiteUrl] = useState(userWebsiteUrl);
  const [location, setLocation] = useState(userLocation);
  const [socialInstagram, setSocialInstagram] = useState(userSocialInstagram);
  const [socialSpotify, setSocialSpotify] = useState(userSocialSpotify);
  const [socialYoutube, setSocialYoutube] = useState(userSocialYoutube);
  const [stageName, setStageName] = useState(userStageName);
  const [genre, setGenre] = useState(userGenre);
  const [tagline, setTagline] = useState(userTagline);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [contactChangeSending, setContactChangeSending] = useState(false);
  const [contactChangeMsg, setContactChangeMsg] = useState<string | null>(null);
  const [contactChangeError, setContactChangeError] = useState<string | null>(null);
  const [newPhoneCountry, setNewPhoneCountry] = useState<CountryIso2>(DEFAULT_PHONE_COUNTRY);
  const [phoneCodeStep, setPhoneCodeStep] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSending, setPhoneCodeSending] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(userAvatarUrl);
  const [coverPreview, setCoverPreview] = useState(userCoverUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.replaceAll(/\s+/g, " ").trim();
  const displayName = fullName || userName;

  const fieldRules: Record<string, FieldRule[]> = {
    firstName: nameRules,
    lastName: nameRules,
    location: locationRules,
    primaryInstrument: instrumentRules,
    studies: [{ type: "max", value: 120, message: "Máximo 120 caracteres." }],
    stageName: instrumentRules,
    genre: [
      { type: "pattern", regex: /^[\p{L}\p{N} .,'\-&\/]*$/u, message: "Solo letras, números y signos básicos." },
      { type: "max", value: 60, message: "Máximo 60 caracteres." },
    ],
    tagline: [{ type: "max", value: 140, message: "Máximo 140 caracteres." }],
    socialInstagram: handleRules,
    websiteUrl: [
      { type: "url", message: "Debe ser una URL válida (https://...)." },
      { type: "max", value: 200, message: "Máximo 200 caracteres." },
    ],
    socialSpotify: optionalUrlRules,
    socialYoutube: optionalUrlRules,
  };

  const handleBlur = (fieldName: string, value: string) => {
    const rules = fieldRules[fieldName];
    if (!rules) return;
    const err = validateField(value, rules);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[fieldName] = err;
      else delete next[fieldName];
      return next;
    });
  };

  const FErr = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <span className="mt-0.5 block text-xs text-[var(--ui-danger)]">{fieldErrors[field]}</span>
    ) : null;
  const [isSaving, setIsSaving] = useState(false);

  const inputClass = "rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2.5 text-sm text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]";

  const uploadImage = async (file: File, kind: "avatar" | "cover") => {
    const parsed = avatarUploadSchema.safeParse({ file, kind });
    if (!parsed.success) {
      throw new Error(parsed.error.flatten().fieldErrors.file?.[0] ?? "No se pudo validar la imagen.");
    }

    const fd = new FormData();
    fd.append("file", parsed.data.file);
    fd.append("kind", parsed.data.kind);
    const res = await fetch("/api/uploads/avatar", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = (await res.json()) as { url: string };
    return data.url;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "avatar");
      setAvatarUrl(url);
    } catch {
      setError("No se pudo subir la foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, "cover");
      setCoverUrl(url);
    } catch {
      setError("No se pudo subir la foto de portada.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSendEmailChange = async () => {
    setContactChangeMsg(null);
    setContactChangeError(null);
    const newValue = newEmail.trim();
    if (!newValue) { setContactChangeError("Ingresa el nuevo correo."); return; }
    setContactChangeSending(true);
    try {
      const res = await fetch("/api/profile/change-contact/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "email", newValue }),
      });
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setContactChangeError(data?.message ?? "No se pudo enviar el correo.");
      } else {
        setContactChangeMsg(data?.message ?? "Revisa tu correo para confirmar el cambio.");
        setNewEmail("");
        setShowEmailForm(false);
      }
    } catch {
      setContactChangeError("Error de red. Intenta de nuevo.");
    } finally {
      setContactChangeSending(false);
    }
  };

  const handleSendPhoneCode = async () => {
    setContactChangeMsg(null);
    setContactChangeError(null);
    const newValue = newPhone.trim();
    if (!newValue) { setContactChangeError("Ingresa el nuevo numero."); return; }
    setContactChangeSending(true);
    try {
      const res = await fetch("/api/profile/change-contact/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "phone", newValue, phoneCountry: newPhoneCountry }),
      });
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setContactChangeError(data?.message ?? "No se pudo enviar el SMS.");
      } else {
        setContactChangeMsg(data?.message ?? "Codigo enviado. Revisa tu telefono.");
        setPhoneCodeStep(true);
        setPhoneCode("");
      }
    } catch {
      setContactChangeError("Error de red. Intenta de nuevo.");
    } finally {
      setContactChangeSending(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    setContactChangeMsg(null);
    setContactChangeError(null);
    if (!/^\d{6}$/.test(phoneCode.trim())) {
      setContactChangeError("Ingresa el codigo de 6 digitos.");
      return;
    }
    setPhoneCodeSending(true);
    try {
      const res = await fetch("/api/profile/change-contact/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneCode.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setContactChangeError(data?.message ?? "Codigo incorrecto.");
      } else {
        setContactChangeMsg(data?.message ?? "Telefono actualizado correctamente.");
        setShowPhoneForm(false);
        setPhoneCodeStep(false);
        setPhoneCode("");
        setNewPhone("");
        router.refresh();
      }
    } catch {
      setContactChangeError("Error de red. Intenta de nuevo.");
    } finally {
      setPhoneCodeSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const firstNameError = validateField(firstName, nameRules);
    const lastNameError = validateField(lastName, nameRules);

    if (firstNameError || lastNameError) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (firstNameError) next.firstName = firstNameError;
        else delete next.firstName;
        if (lastNameError) next.lastName = lastNameError;
        else delete next.lastName;
        return next;
      });
      setError(firstNameError ?? lastNameError ?? "Revisa los campos del formulario.");
      return;
    }

    const parsed = updateProfileSchema.safeParse({
      name: fullName,
      bio,
      musicianType,
      primaryInstrument,
      orientation,
      studies,
      avatarUrl, coverUrl, websiteUrl, location, socialInstagram, socialSpotify, socialYoutube,
      stageName, genre, tagline,
    });

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setError(Object.values(fe).flat()[0] ?? "Revisa los campos del formulario.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    setIsSaving(false);

    if (!response.ok) {
      setError(payload?.message ?? "No se pudo actualizar el perfil.");
      return;
    }

    setSuccess("Perfil actualizado correctamente.");
    router.refresh();
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">

      {/* ── Banner / cover ── full width, tall like Discord */}
      <div className="group relative h-52 w-full cursor-pointer bg-gradient-to-br from-[color:rgb(var(--ui-glow-primary)/0.4)] to-[color:rgb(var(--ui-glow-accent)/0.25)]"
           onClick={() => !uploadingCover && coverInputRef.current?.click()}
           role="button" tabIndex={0}
           onKeyDown={(e) => e.key === "Enter" && coverInputRef.current?.click()}
           title="Cambiar portada"
      >
        {coverPreview ? (
          <img src={coverPreview} alt="Portada" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--ui-muted)]">
            <svg viewBox="0 0 24 24" className="h-10 w-10 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span className="text-sm opacity-60">Haz clic para agregar una portada</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span className="text-sm font-semibold text-white">{uploadingCover ? "Subiendo…" : "Cambiar portada"}</span>
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      {/* ── Avatar row — overlaps cover ── */}
      <div className="relative px-6 pb-4">
        {/* Avatar sits on the border between cover and content */}
        <div className="absolute -top-14 left-6">
          <div className="group relative">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-[var(--ui-surface)] bg-[var(--ui-primary)] shadow-xl focus:outline-none"
              title="Cambiar foto de perfil"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-[var(--ui-on-primary)]">
                  {getInitials(displayName)}
                </span>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span className="text-[10px] font-semibold text-white">{uploadingAvatar ? "…" : "Cambiar"}</span>
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Top-right action buttons */}
        <div className="flex flex-wrap justify-end gap-2 pt-16 sm:pt-3">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="flex items-center gap-1.5 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {uploadingAvatar ? "Subiendo…" : "Foto de perfil"}
          </button>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="flex items-center gap-1.5 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {uploadingCover ? "Subiendo…" : "Portada"}
          </button>
          <a
            href={`/artist/${userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ver perfil
          </a>
        </div>

        {/* Name below avatar */}
        <div className="mt-2 pl-1" style={{ paddingTop: "4.5rem" }}>
          <p className="text-xl font-bold text-[var(--ui-text)]">{displayName}</p>
          <p className="text-sm text-[var(--ui-muted)]">{userEmail}</p>
          {userPhone && (
            <p className="text-sm text-[var(--ui-muted)]">{userPhone}</p>
          )}
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="grid gap-6 p-6 lg:grid-cols-2">

        {/* Left column */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ui-muted)]">Informacion basica</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={labelClass}>Nombre <span className="text-[var(--ui-danger)]">*</span></span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={(e) => handleBlur("firstName", e.target.value)}
                className={`${inputClass} ${fieldErrors.firstName ? "border-[var(--ui-danger)]" : ""}`}
                placeholder="Tu nombre"
                maxLength={80}
              />
              <FErr field="firstName" />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Apellido <span className="text-[var(--ui-danger)]">*</span></span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={(e) => handleBlur("lastName", e.target.value)}
                className={`${inputClass} ${fieldErrors.lastName ? "border-[var(--ui-danger)]" : ""}`}
                placeholder="Tu apellido"
                maxLength={80}
              />
              <FErr field="lastName" />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className={labelClass}>Ubicación</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={(e) => handleBlur("location", e.target.value)}
              className={`${inputClass} ${fieldErrors.location ? "border-[var(--ui-danger)]" : ""}`}
              placeholder="Ciudad, País"
              maxLength={80}
            />
            <FErr field="location" />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={300}
              className={`${inputClass} resize-none`}
              placeholder="Cuéntale algo a la comunidad sobre ti…"
            />
            <span className="block text-right text-xs text-[var(--ui-muted)]">{bio.length}/300</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={labelClass}>Tipo de músico</span>
              <select value={musicianType} onChange={(e) => setMusicianType(e.target.value)} className={inputClass}>
                {MUSICIAN_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Instrumento principal</span>
              <input
                value={primaryInstrument}
                onChange={(e) => setPrimaryInstrument(e.target.value)}
                onBlur={(e) => handleBlur("primaryInstrument", e.target.value)}
                className={`${inputClass} ${fieldErrors.primaryInstrument ? "border-[var(--ui-danger)]" : ""}`}
                placeholder="Guitarra, Piano…"
                maxLength={60}
              />
              <FErr field="primaryInstrument" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={labelClass}>Estoy buscando…</span>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className={inputClass}>
                {ORIENTATIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Formación musical</span>
              <input
                value={studies}
                onChange={(e) => setStudies(e.target.value)}
                onBlur={(e) => handleBlur("studies", e.target.value)}
                className={`${inputClass} ${fieldErrors.studies ? "border-[var(--ui-danger)]" : ""}`}
                placeholder="Conservatorio, Autodidacta…"
                maxLength={120}
              />
              <FErr field="studies" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={labelClass}>Nombre artístico / Stage name</span>
              <input
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                onBlur={(e) => handleBlur("stageName", e.target.value)}
                className={`${inputClass} ${fieldErrors.stageName ? "border-[var(--ui-danger)]" : ""}`}
                placeholder="Tu nombre de escenario"
                maxLength={60}
              />
              <FErr field="stageName" />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Género musical</span>
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                onBlur={(e) => handleBlur("genre", e.target.value)}
                className={`${inputClass} ${fieldErrors.genre ? "border-[var(--ui-danger)]" : ""}`}
                placeholder="Indie, Rock, Jazz…"
                maxLength={60}
              />
              <FErr field="genre" />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className={labelClass}>Frase / Slogan</span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              onBlur={(e) => handleBlur("tagline", e.target.value)}
              className={`${inputClass} ${fieldErrors.tagline ? "border-[var(--ui-danger)]" : ""}`}
              placeholder="Una frase que te identifique"
              maxLength={140}
            />
            <FErr field="tagline" />
          </label>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ui-muted)]">Presencia digital</p>

          <label className="block space-y-1.5">
            <span className={labelClass}>Sitio web</span>
            <div className={`flex items-center gap-2 rounded-xl border ${fieldErrors.websiteUrl ? "border-[var(--ui-danger)]" : "border-[color:var(--ui-border)]"} bg-[var(--ui-surface-soft)] px-3 py-2.5 focus-within:border-[var(--ui-primary)] focus-within:ring-2 focus-within:ring-[color:rgb(var(--ui-glow-primary)/0.2)]`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onBlur={(e) => handleBlur("websiteUrl", e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                placeholder="https://tu-web.com"
                type="url"
                maxLength={200}
              />
            </div>
            <FErr field="websiteUrl" />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Instagram</span>
            <div className={`flex items-center gap-2 rounded-xl border ${fieldErrors.socialInstagram ? "border-[var(--ui-danger)]" : "border-[color:var(--ui-border)]"} bg-[var(--ui-surface-soft)] px-3 py-2.5 focus-within:border-[var(--ui-primary)] focus-within:ring-2 focus-within:ring-[color:rgb(var(--ui-glow-primary)/0.2)]`}>
              <span className="shrink-0 text-sm text-[var(--ui-muted)]">@</span>
              <input
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                onBlur={(e) => handleBlur("socialInstagram", e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                placeholder="tu_usuario"
                maxLength={80}
              />
            </div>
            <FErr field="socialInstagram" />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Spotify</span>
            <div className={`flex items-center gap-2 rounded-xl border ${fieldErrors.socialSpotify ? "border-[var(--ui-danger)]" : "border-[color:var(--ui-border)]"} bg-[var(--ui-surface-soft)] px-3 py-2.5 focus-within:border-[var(--ui-primary)] focus-within:ring-2 focus-within:ring-[color:rgb(var(--ui-glow-primary)/0.2)]`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#1db954]" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              <input
                value={socialSpotify}
                onChange={(e) => setSocialSpotify(e.target.value)}
                onBlur={(e) => handleBlur("socialSpotify", e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                placeholder="https://open.spotify.com/artist/…"
                type="url"
                maxLength={400}
              />
            </div>
            <FErr field="socialSpotify" />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>YouTube</span>
            <div className={`flex items-center gap-2 rounded-xl border ${fieldErrors.socialYoutube ? "border-[var(--ui-danger)]" : "border-[color:var(--ui-border)]"} bg-[var(--ui-surface-soft)] px-3 py-2.5 focus-within:border-[var(--ui-primary)] focus-within:ring-2 focus-within:ring-[color:rgb(var(--ui-glow-primary)/0.2)]`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#ff0000]" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <input
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                onBlur={(e) => handleBlur("socialYoutube", e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-muted)]"
                placeholder="https://youtube.com/@canal"
                type="url"
                maxLength={400}
              />
            </div>
            <FErr field="socialYoutube" />
          </label>

          {/* Stats summary */}
          <div className="mt-2 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Resumen de perfil</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { label: "Instrumento", value: primaryInstrument || "—" },
                { label: "Tipo", value: musicianType || "—" },
                { label: "Ubicacion", value: location || "—" },
                { label: "Buscando", value: orientation || "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--ui-muted)]">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--ui-text)] truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback + submit — full width */}
        <div className="lg:col-span-2 space-y-3">
          {Object.keys(fieldErrors).length > 0 && (
            <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.1)] px-3 py-2 text-xs text-[var(--ui-danger)]">
              Revisa los campos marcados antes de guardar.
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2.5 text-sm text-[var(--ui-danger)]">{error}</p>
          )}
          {success && (
            <p className="rounded-xl bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-3 py-2.5 text-sm text-[var(--ui-accent)]">{success}</p>
          )}
          <button
            type="submit"
            disabled={isSaving || uploadingAvatar || uploadingCover || Object.keys(fieldErrors).length > 0}
            className="rh-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-primary)] px-4 py-3 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando…" : uploadingAvatar || uploadingCover ? "Subiendo imagen…" : "Guardar cambios"}
          </button>
        </div>
      </form>
      {/* Contact change section */}
      <div className="border-t border-[color:var(--ui-border)] p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--ui-muted)]">Correo y telefono</p>

        {contactChangeMsg && (
          <p className="rounded-xl bg-[color:rgb(var(--ui-glow-accent)/0.14)] px-3 py-2.5 text-sm text-[var(--ui-accent)]">{contactChangeMsg}</p>
        )}
        {contactChangeError && (
          <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2.5 text-sm text-[var(--ui-danger)]">{contactChangeError}</p>
        )}

        {/* Email change */}
        <div className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Correo electronico</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--ui-text)]">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowEmailForm((v) => !v); setShowPhoneForm(false); setContactChangeMsg(null); setContactChangeError(null); }}
              className="shrink-0 rounded-lg border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
            >
              {showEmailForm ? "Cancelar" : "Cambiar"}
            </button>
          </div>
          {showEmailForm && (
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nuevo correo electronico"
                className="rh-input flex-1 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
              />
              <button
                type="button"
                disabled={contactChangeSending}
                onClick={handleSendEmailChange}
                className="shrink-0 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-xs font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:opacity-60"
              >
                {contactChangeSending ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          )}
        </div>

        {/* Phone change */}
        <div className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Telefono</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--ui-text)]">{userPhone || "No registrado"}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !showPhoneForm;
                setShowPhoneForm(next);
                setShowEmailForm(false);
                setContactChangeMsg(null);
                setContactChangeError(null);
                if (!next) { setPhoneCodeStep(false); setPhoneCode(""); setNewPhone(""); }
              }}
              className="shrink-0 rounded-lg border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
            >
              {showPhoneForm ? "Cancelar" : "Cambiar"}
            </button>
          </div>

          {showPhoneForm && !phoneCodeStep && (
            <div className="mt-3 space-y-2">
              <PhoneInput
                defaultCountry={DEFAULT_PHONE_COUNTRY}
                preferredCountries={["do", "us", "es", "mx", "co", "ar", "ve", "cl", "pe", "ec", "pa", "pr"]}
                forceDialCode
                value={newPhone}
                onChange={(nextPhone, meta) => {
                  setNewPhone(nextPhone);
                  setNewPhoneCountry(meta.country.iso2 as CountryIso2);
                }}
                className="rh-phone-field"
                inputProps={{
                  autoComplete: "tel",
                  inputMode: "numeric",
                  onKeyDown: preventNonNumericPhoneInput,
                }}
              />
              <button
                type="button"
                disabled={contactChangeSending || !newPhone.trim()}
                onClick={handleSendPhoneCode}
                className="w-full rounded-xl bg-[var(--ui-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:opacity-60"
              >
                {contactChangeSending ? "Enviando..." : "Enviar codigo SMS"}
              </button>
            </div>
          )}

          {showPhoneForm && phoneCodeStep && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-[var(--ui-muted)]">
                Te enviamos un codigo de 6 digitos al nuevo numero. Ingresalo abajo. Expira en 15 minutos.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="rh-input w-32 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-center text-lg font-bold tracking-widest text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-[color:rgb(var(--ui-glow-primary)/0.2)]"
                />
                <button
                  type="button"
                  disabled={phoneCodeSending || phoneCode.length < 6}
                  onClick={handleVerifyPhoneCode}
                  className="flex-1 rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] transition hover:bg-[var(--ui-primary-hover)] disabled:opacity-60"
                >
                  {phoneCodeSending ? "Verificando..." : "Verificar"}
                </button>
              </div>
              <button
                type="button"
                disabled={contactChangeSending}
                onClick={() => { setPhoneCodeStep(false); setPhoneCode(""); }}
                className="text-xs text-[var(--ui-muted)] underline hover:text-[var(--ui-text)]"
              >
                Cambiar numero o reenviar codigo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
