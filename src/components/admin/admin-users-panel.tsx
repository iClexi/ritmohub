"use client";

import { animate, stagger } from "animejs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stageName: string;
  role: "user" | "admin";
  musicianType: string;
  primaryInstrument: string;
  bio: string;
  authProvider: string;
  avatarUrl: string;
  coverUrl: string;
  websiteUrl: string;
  location: string;
  socialInstagram: string;
  socialSpotify: string;
  socialYoutube: string;
  genre: string;
  tagline: string;
  orientation: string;
  studies: string;
  isSolo: boolean;
  createdAt: string;
  updatedAt: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastLoginAt: string | null;
  visitCount: number;
  lastIp: string | null;
  lastUserAgent: string | null;
  lastBrowser: string | null;
  lastBrowserVersion: string | null;
  lastOs: string | null;
  lastOsVersion: string | null;
  lastDeviceType: string | null;
  lastDeviceVendor: string | null;
  lastScreenWidth: number | null;
  lastScreenHeight: number | null;
  lastViewportWidth: number | null;
  lastViewportHeight: number | null;
  lastPixelRatio: number | null;
  lastColorDepth: number | null;
  lastLanguage: string | null;
  lastLanguages: string | null;
  lastTimezone: string | null;
  lastTimezoneOffset: number | null;
  lastReferrer: string | null;
  lastCountry: string | null;
  lastRegion: string | null;
  lastCityGeo: string | null;
  lastIsp: string | null;
  lastGeoLat: number | null;
  lastGeoLon: number | null;
  lastConnection: string | null;
  lastPlatform: string | null;
  lastCpuCores: number | null;
  lastMemoryGb: number | null;
  lastTouchPoints: number | null;
  lastDnt: string | null;
};

type AdminVisit = {
  id: string;
  user_id: string;
  occurred_at: string;
  source: string;
  ip: string | null;
  user_agent: string | null;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  device_type: string | null;
  device_vendor: string | null;
  screen_width: number | null;
  screen_height: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  pixel_ratio: number | null;
  color_depth: number | null;
  language: string | null;
  languages: string | null;
  timezone: string | null;
  timezone_offset: number | null;
  referrer: string | null;
  page_path: string | null;
  country: string | null;
  region: string | null;
  city_geo: string | null;
  isp: string | null;
  geo_lat: number | null;
  geo_lon: number | null;
  connection: string | null;
  platform: string | null;
  cpu_cores: number | null;
  memory_gb: number | null;
  touch_points: number | null;
  dnt: string | null;
};

type UserDraft = {
  name: string;
  email: string;
  phone: string;
  stageName: string;
  role: "user" | "admin";
  musicianType: string;
  primaryInstrument: string;
  bio: string;
  location: string;
  websiteUrl: string;
  socialInstagram: string;
  socialSpotify: string;
  socialYoutube: string;
  genre: string;
  tagline: string;
  password: string;
};

type FilterKind = "all" | "admin" | "google" | "meta" | "password";

function makeBlankAdminUser(id: string): AdminUser {
  return {
    id,
    name: "",
    email: "",
    phone: null,
    stageName: "",
    role: "user",
    musicianType: "",
    primaryInstrument: "",
    bio: "",
    authProvider: "password",
    avatarUrl: "",
    coverUrl: "",
    websiteUrl: "",
    location: "",
    socialInstagram: "",
    socialSpotify: "",
    socialYoutube: "",
    genre: "",
    tagline: "",
    orientation: "",
    studies: "",
    isSolo: false,
    createdAt: "",
    updatedAt: "",
    firstSeenAt: null,
    lastSeenAt: null,
    lastLoginAt: null,
    visitCount: 0,
    lastIp: null,
    lastUserAgent: null,
    lastBrowser: null,
    lastBrowserVersion: null,
    lastOs: null,
    lastOsVersion: null,
    lastDeviceType: null,
    lastDeviceVendor: null,
    lastScreenWidth: null,
    lastScreenHeight: null,
    lastViewportWidth: null,
    lastViewportHeight: null,
    lastPixelRatio: null,
    lastColorDepth: null,
    lastLanguage: null,
    lastLanguages: null,
    lastTimezone: null,
    lastTimezoneOffset: null,
    lastReferrer: null,
    lastCountry: null,
    lastRegion: null,
    lastCityGeo: null,
    lastIsp: null,
    lastGeoLat: null,
    lastGeoLon: null,
    lastConnection: null,
    lastPlatform: null,
    lastCpuCores: null,
    lastMemoryGb: null,
    lastTouchPoints: null,
    lastDnt: null,
  };
}

function emptyDraftFromUser(user: AdminUser): UserDraft {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    stageName: user.stageName,
    role: user.role,
    musicianType: user.musicianType,
    primaryInstrument: user.primaryInstrument,
    bio: user.bio,
    location: user.location,
    websiteUrl: user.websiteUrl,
    socialInstagram: user.socialInstagram,
    socialSpotify: user.socialSpotify,
    socialYoutube: user.socialYoutube,
    genre: user.genre,
    tagline: user.tagline,
    password: "",
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return formatDate(value);
}

function getInitials(name: string, email: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getProviderLabel(provider: string) {
  if (provider === "google") return "Google";
  if (provider === "meta") return "Meta";
  return "Email";
}

function getProviderTone(provider: string) {
  if (provider === "google") return "from-[#4285F4] to-[#34A853]";
  if (provider === "meta") return "from-[#1877F2] to-[#42B0FF]";
  return "from-[var(--ui-primary)] to-[var(--ui-accent)]";
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.65 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.66 3.8 14.55 3 12 3 6.99 3 3 6.99 3 12s3.99 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.07-1.05-.15-1.5Z" />
      </svg>
    );
  }
  if (provider === "meta") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path fill="#fff" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.95c4.78-.75 9-4.94 9-9.95Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone: "primary" | "accent" | "neutral" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    primary: "from-[color:rgb(var(--ui-glow-primary)/0.18)] to-[color:rgb(var(--ui-glow-primary)/0.04)]",
    accent: "from-[color:rgb(var(--ui-glow-accent)/0.20)] to-[color:rgb(var(--ui-glow-accent)/0.04)]",
    neutral: "from-[var(--ui-surface-soft)] to-[var(--ui-surface)]",
    danger: "from-[color:rgb(var(--ui-glow-danger)/0.18)] to-[color:rgb(var(--ui-glow-danger)/0.04)]",
  };
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-gradient-to-br ${toneClasses[tone]} p-5 transition hover:scale-[1.01]`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ui-text)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--ui-muted)]">{hint}</p> : null}
    </article>
  );
}

function RoleBadge({ role }: { role: "user" | "admin" }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-on-primary)] shadow-[0_4px_14px_rgb(var(--ui-glow-primary)/0.32)]">
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
          <path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4Z" />
        </svg>
        Admin
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-muted)]">
      Usuario
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const tone = getProviderTone(provider);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tone} px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm`}
    >
      <ProviderIcon provider={provider} />
      {getProviderLabel(provider)}
    </span>
  );
}

function Avatar({
  user,
  size = 44,
}: {
  user: { name: string; email: string; avatarUrl: string };
  size?: number;
}) {
  const initials = getInitials(user.name, user.email);
  const dim = `${size}px`;

  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name}
        style={{ width: dim, height: dim }}
        className="rounded-full border border-[color:var(--ui-border)] object-cover shadow-sm"
        onError={(event) => {
          (event.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      style={{ width: dim, height: dim, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-accent)] font-semibold text-[var(--ui-on-primary)] shadow-[0_6px_18px_rgb(var(--ui-glow-primary)/0.25)]"
    >
      {initials}
    </div>
  );
}

function FieldGroup({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <label className={`space-y-1.5 ${span === 2 ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ui-muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "rh-input w-full rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2.5 text-sm text-[var(--ui-text)] outline-none transition focus:border-[color:rgb(var(--ui-glow-primary)/0.55)] focus:ring-2 focus:ring-[color:rgb(var(--ui-glow-primary)/0.18)]";

export function AdminUsersPanel() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKind>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "tracking" | "visits" | "edit">("profile");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailVisits, setDetailVisits] = useState<AdminVisit[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const hydrateDrafts = useCallback((items: AdminUser[]) => {
    const next: Record<string, UserDraft> = {};
    for (const item of items) {
      next[item.id] = emptyDraftFromUser(item);
    }
    setDrafts(next);
  }, []);

  const loadUsers = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string; users?: AdminUser[] }
          | null;

        if (!response.ok || !payload?.users) {
          setErrorMessage(payload?.message ?? "No pudimos cargar los usuarios.");
          setUsers([]);
          setDrafts({});
          return;
        }

        setUsers(payload.users);
        hydrateDrafts(payload.users);
      } catch {
        setErrorMessage("No pudimos cargar los usuarios.");
        setUsers([]);
        setDrafts({});
      } finally {
        setIsLoading(false);
      }
    },
    [hydrateDrafts],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers(search.trim());
    }, 280);
    return () => window.clearTimeout(timeout);
  }, [loadUsers, search]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = root.querySelectorAll("[data-admin-animate]");
    const animation = animate(nodes, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.98, 1],
      delay: stagger(55),
      duration: 700,
      ease: "outCubic",
    });
    return () => {
      animation.revert();
    };
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const oauth = users.filter((u) => u.authProvider !== "password").length;
    const today = users.filter((u) => {
      const created = new Date(u.createdAt).getTime();
      if (Number.isNaN(created)) return false;
      return Date.now() - created < 24 * 60 * 60 * 1000;
    }).length;
    const online = users.filter((u) => isOnline(u.lastSeenAt)).length;
    const activeToday = users.filter((u) => {
      if (!u.lastSeenAt) return false;
      const t = new Date(u.lastSeenAt).getTime();
      if (Number.isNaN(t)) return false;
      return Date.now() - t < 24 * 60 * 60 * 1000;
    }).length;
    return { total, admins, oauth, today, online, activeToday };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (filter === "all") return users;
    if (filter === "admin") return users.filter((u) => u.role === "admin");
    return users.filter((u) => u.authProvider === filter);
  }, [users, filter]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || isLoading || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = root.querySelectorAll("[data-user-card]");
    const animation = animate(cards, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: stagger(26),
      duration: 420,
      ease: "outCubic",
    });
    return () => {
      animation.revert();
    };
  }, [filter, filteredUsers.length, isLoading]);

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  useEffect(() => {
    if (selectedUserId && !selectedUser) {
      setSelectedUserId(null);
    }
  }, [selectedUser, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setDetailVisits([]);
      return;
    }
    setDetailTab("profile");
    setConfirmDeleteId(null);
    setDetailLoading(true);

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/users/${selectedUserId}`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { user?: AdminUser; visits?: AdminVisit[] };
        if (cancelled) return;
        if (payload.user) {
          const fresh = payload.user;
          setUsers((prev) => prev.map((u) => (u.id === fresh.id ? fresh : u)));
          setDrafts((prev) => ({
            ...prev,
            [fresh.id]: { ...emptyDraftFromUser(fresh), password: "" },
          }));
        }
        if (Array.isArray(payload.visits)) {
          setDetailVisits(payload.visits as AdminVisit[]);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedUserId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedUserId]);

  const updateDraftField = <K extends keyof UserDraft>(
    userId: string,
    key: K,
    value: UserDraft[K],
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? emptyDraftFromUser(makeBlankAdminUser(userId))),
        [key]: value,
      },
    }));
  };

  const saveUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveSaveId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; user?: AdminUser }
        | null;

      if (!response.ok || !payload?.user) {
        setErrorMessage(payload?.message ?? "No pudimos actualizar este usuario.");
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === userId ? payload.user! : item)));
      setDrafts((prev) => ({
        ...prev,
        [userId]: { ...emptyDraftFromUser(payload.user!), password: "" },
      }));
      setSuccessMessage(payload.message ?? "Usuario actualizado.");
      setDetailTab("profile");
    } catch {
      setErrorMessage("No pudimos actualizar este usuario.");
    } finally {
      setActiveSaveId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveDeleteId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "No pudimos eliminar este usuario.");
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== userId));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setSelectedUserId(null);
      setConfirmDeleteId(null);
      setSuccessMessage(payload?.message ?? "Usuario eliminado.");
    } catch {
      setErrorMessage("No pudimos eliminar este usuario.");
    } finally {
      setActiveDeleteId(null);
    }
  };

  return (
    <main ref={rootRef} className="min-h-screen bg-[var(--ui-bg)] px-4 pb-12 pt-24 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <header data-admin-animate className="overflow-hidden rounded-[2rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_24px_60px_-32px_rgb(var(--ui-glow-primary)/0.4)]">
          <div className="relative bg-gradient-to-br from-[color:rgb(var(--ui-glow-primary)/0.16)] via-[var(--ui-surface)] to-[color:rgb(var(--ui-glow-accent)/0.12)] px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ui-muted)]">
                  RitmoHub Admin
                </p>
                <h1 className="mt-2 bg-gradient-to-r from-[var(--ui-text)] to-[color:rgb(var(--ui-glow-primary)/0.85)] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                  Panel de administracion
                </h1>
                <p className="mt-2 max-w-xl text-sm text-[var(--ui-muted)]">
                  Gestiona usuarios, perfiles, contactos y roles. Cambios sincronizados con la base de datos en vivo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/admin/traffic"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:rgb(var(--ui-glow-primary)/0.35)] bg-[color:rgb(var(--ui-glow-primary)/0.10)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-primary)] transition hover:border-[color:rgb(var(--ui-glow-primary)/0.55)]"
                >
                  Trafico en vivo
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[color:rgb(var(--ui-glow-primary)/0.4)] hover:bg-[var(--ui-surface-soft)]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Volver al panel
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Total" value={stats.total} hint="Usuarios registrados" tone="primary" />
            <StatTile label="En linea" value={stats.online} hint="Activos ultimos 5 min" tone="accent" />
            <StatTile label="Activos hoy" value={stats.activeToday} hint="Visitaron las ultimas 24h" tone="primary" />
            <StatTile label="Administradores" value={stats.admins} hint="Acceso elevado" tone="accent" />
            <StatTile label="OAuth" value={stats.oauth} hint="Google + Meta" tone="neutral" />
            <StatTile label="Nuevos hoy" value={stats.today} hint="Registrados las ultimas 24h" tone="danger" />
          </div>
        </header>

        <div data-admin-animate className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-muted)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, correo o nombre artistico..."
                className="w-full rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] py-2.5 pl-10 pr-3 text-sm text-[var(--ui-text)] outline-none transition focus:border-[color:rgb(var(--ui-glow-primary)/0.5)] focus:ring-2 focus:ring-[color:rgb(var(--ui-glow-primary)/0.18)]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "admin", "google", "meta", "password"] as FilterKind[]).map((kind) => {
                const labels: Record<FilterKind, string> = {
                  all: "Todos",
                  admin: "Admins",
                  google: "Google",
                  meta: "Meta",
                  password: "Email",
                };
                const isActive = filter === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setFilter(kind)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-transparent bg-[var(--ui-primary)] text-[var(--ui-on-primary)] shadow-[0_8px_22px_-8px_rgb(var(--ui-glow-primary)/0.6)]"
                        : "border-[color:var(--ui-border)] text-[var(--ui-muted)] hover:border-[color:rgb(var(--ui-glow-primary)/0.4)] hover:text-[var(--ui-text)]"
                    }`}
                  >
                    {labels[kind]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.45)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-4 py-3 text-sm text-[var(--ui-danger)]">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[color:rgb(var(--ui-glow-accent)/0.45)] bg-[color:rgb(var(--ui-glow-accent)/0.08)] px-4 py-3 text-sm text-[var(--ui-accent)]">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 3 3 5-6" />
            </svg>
            <span>{successMessage}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]"
              />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-6 py-16 text-center">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-[var(--ui-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
            <p className="text-sm font-semibold text-[var(--ui-text)]">No encontramos usuarios.</p>
            <p className="text-xs text-[var(--ui-muted)]">Ajusta tu busqueda o filtros para ver mas resultados.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((item) => (
              <button
                key={item.id}
                data-user-card
                type="button"
                onClick={() => setSelectedUserId(item.id)}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--ui-glow-primary)/0.4)] hover:shadow-[0_18px_40px_-22px_rgb(var(--ui-glow-primary)/0.55)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[color:rgb(var(--ui-glow-primary)/0.4)] to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-start gap-3">
                  <Avatar user={item} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold text-[var(--ui-text)]">{item.name}</h3>
                      {isOnline(item.lastSeenAt) ? (
                        <span
                          className="inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129_/_0.18)]"
                          title="En linea"
                        />
                      ) : null}
                    </div>
                    {item.stageName ? (
                      <p className="truncate text-xs text-[var(--ui-muted)]">@{item.stageName}</p>
                    ) : null}
                    <p className="mt-0.5 truncate text-xs text-[var(--ui-muted)]">{item.email}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={item.role} />
                  <ProviderBadge provider={item.authProvider} />
                  {item.phone ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-muted)]">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
                        <path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.6-.4 1-.3 1.1.4 2.4.6 3.7.6.6 0 1 .4 1 1V19c0 .6-.4 1-1 1C10.4 20 4 13.6 4 5.6c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.4 0 .8-.3 1l-2.1 2.5Z" />
                      </svg>
                      <span className="max-w-[8rem] truncate">{item.phone}</span>
                    </span>
                  ) : null}
                  {item.lastCountry ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:rgb(var(--ui-glow-primary)/0.35)] bg-[color:rgb(var(--ui-glow-primary)/0.10)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-primary)]">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                      </svg>
                      <span className="max-w-[10rem] truncate">{item.lastCountry}</span>
                    </span>
                  ) : item.location ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-muted)]">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12Z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <span className="max-w-[10rem] truncate">{item.location}</span>
                    </span>
                  ) : null}
                  {item.lastDeviceType ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-muted)]">
                      {item.lastDeviceType === "mobile" ? "📱" : item.lastDeviceType === "tablet" ? "📲" : item.lastDeviceType === "desktop" ? "💻" : "🤖"}
                      <span>{item.lastDeviceType}</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[color:var(--ui-border)] pt-3 text-[11px] text-[var(--ui-muted)]">
                  <span className="truncate">
                    {item.lastSeenAt ? `Activo ${formatRelative(item.lastSeenAt)}` : `Actualizado ${formatRelative(item.updatedAt)}`}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 translate-x-0 text-[var(--ui-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ui-text)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedUser ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
          onClick={() => setSelectedUserId(null)}
        >
          <div
            className="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-32 bg-gradient-to-br from-[color:rgb(var(--ui-glow-primary)/0.5)] via-[color:rgb(var(--ui-glow-accent)/0.35)] to-[color:rgb(var(--ui-glow-primary)/0.5)]">
              {selectedUser.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedUser.coverUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ui-surface)] via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="relative -mt-12 px-6 pb-2 sm:px-8">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="ring-4 ring-[var(--ui-surface)]">
                    <Avatar user={selectedUser} size={88} />
                  </div>
                  <div className="pb-1">
                    <h2 className="text-xl font-semibold text-[var(--ui-text)] sm:text-2xl">{selectedUser.name}</h2>
                    {selectedUser.stageName ? (
                      <p className="text-sm text-[var(--ui-muted)]">@{selectedUser.stageName}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <RoleBadge role={selectedUser.role} />
                      <ProviderBadge provider={selectedUser.authProvider} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 -mx-1 flex items-center gap-0.5 overflow-x-auto border-b border-[color:var(--ui-border)] px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(["profile", "tracking", "visits", "edit"] as const).map((tab) => {
                  const labels = {
                    profile: "Informacion",
                    tracking: "Sesion actual",
                    visits: `Visitas (${detailVisits.length})`,
                    edit: "Editar",
                  } as const;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDetailTab(tab)}
                      className={`relative -mb-px shrink-0 whitespace-nowrap px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                        detailTab === tab
                          ? "text-[var(--ui-text)]"
                          : "text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
                      }`}
                    >
                      {labels[tab]}
                      {detailTab === tab ? (
                        <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-accent)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto px-4 pb-6 pt-4 sm:px-6 lg:px-8">
              {detailTab === "profile" ? (
                <ProfileView user={selectedUser} />
              ) : detailTab === "tracking" ? (
                <TrackingView user={selectedUser} />
              ) : detailTab === "visits" ? (
                <VisitsView visits={detailVisits} loading={detailLoading} />
              ) : drafts[selectedUser.id] ? (
                <EditView
                  draft={drafts[selectedUser.id]}
                  onUpdate={(key, value) => updateDraftField(selectedUser.id, key, value)}
                />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-6 py-4 sm:px-8">
              {confirmDeleteId === selectedUser.id ? (
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--ui-danger)]">Confirmar eliminacion?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={activeDeleteId === selectedUser.id}
                      onClick={() => void deleteUser(selectedUser.id)}
                      className="rounded-xl bg-[var(--ui-danger)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {activeDeleteId === selectedUser.id ? "Eliminando..." : "Si, eliminar"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(selectedUser.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[color:rgb(var(--ui-glow-danger)/0.5)] px-3.5 py-2 text-sm font-semibold text-[var(--ui-danger)] transition hover:bg-[color:rgb(var(--ui-glow-danger)/0.10)]"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                    Eliminar
                  </button>
                  {detailTab === "edit" ? (
                    <button
                      type="button"
                      disabled={activeSaveId === selectedUser.id}
                      onClick={() => void saveUser(selectedUser.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-accent)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)] shadow-[0_10px_28px_-10px_rgb(var(--ui-glow-primary)/0.7)] transition hover:scale-[1.02] disabled:opacity-60"
                    >
                      {activeSaveId === selectedUser.id ? (
                        <>Guardando...</>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <path d="m5 13 4 4 10-10" />
                          </svg>
                          Guardar cambios
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDetailTab("edit")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[color:rgb(var(--ui-glow-primary)/0.4)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      Editar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function isOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const ms = new Date(lastSeenAt).getTime();
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms < 5 * 60 * 1000;
}

function formatScreen(w: number | null, h: number | null): string {
  if (!w || !h) return "-";
  return `${w} x ${h}`;
}

function formatNumber(value: number | null, suffix = ""): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value}${suffix}`;
}

function formatDateMaybe(value: string | null | undefined): string {
  if (!value) return "-";
  return formatDate(value);
}

function formatRelativeMaybe(value: string | null | undefined): string {
  if (!value) return "-";
  return formatRelative(value);
}

function ProfileView({ user }: { user: AdminUser }) {
  const socials: Array<{ label: string; value: string; href: string }> = [];
  if (user.socialInstagram) socials.push({ label: "Instagram", value: user.socialInstagram, href: `https://instagram.com/${user.socialInstagram.replace(/^@/, "")}` });
  if (user.socialSpotify) socials.push({ label: "Spotify", value: user.socialSpotify, href: user.socialSpotify });
  if (user.socialYoutube) socials.push({ label: "YouTube", value: user.socialYoutube, href: user.socialYoutube });

  return (
    <div className="space-y-5">
      {user.tagline ? (
        <p className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 text-sm italic text-[var(--ui-text)]">
          &ldquo;{user.tagline}&rdquo;
        </p>
      ) : null}

      <Section title="Identidad">
        <DataCell label="ID" value={user.id} mono />
        <DataCell label="Nombre" value={user.name || "-"} />
        <DataCell label="Nombre artistico" value={user.stageName || "-"} />
        <DataCell label="Rol" value={user.role === "admin" ? "Administrador" : "Usuario"} />
        <DataCell label="Proveedor auth" value={getProviderLabel(user.authProvider)} />
        <DataCell label="Solista" value={user.isSolo ? "Si" : "No"} />
      </Section>

      <Section title="Contacto">
        <DataCell label="Correo" value={user.email || "-"} href={`mailto:${user.email}`} />
        <DataCell label="Telefono" value={user.phone || "-"} href={user.phone ? `tel:${user.phone}` : undefined} />
        <DataCell label="Ubicacion" value={user.location || "-"} />
        <DataCell label="Sitio web" value={user.websiteUrl || "-"} href={user.websiteUrl || undefined} />
      </Section>

      <Section title="Perfil musical">
        <DataCell label="Tipo de musico" value={user.musicianType || "-"} />
        <DataCell label="Instrumento principal" value={user.primaryInstrument || "-"} />
        <DataCell label="Genero" value={user.genre || "-"} />
        <DataCell label="Orientacion" value={user.orientation || "-"} />
        <DataCell label="Estudios" value={user.studies || "-"} />
        <DataCell label="Tagline" value={user.tagline || "-"} />
      </Section>

      {(user.bio || user.avatarUrl || user.coverUrl) ? (
        <Section title="Multimedia y bio" cols={1}>
          {user.bio ? (
            <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-muted)]">Bio</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ui-text)]">{user.bio}</p>
            </div>
          ) : null}
          <DataCell label="Avatar URL" value={user.avatarUrl || "-"} href={user.avatarUrl || undefined} mono />
          <DataCell label="Cover URL" value={user.coverUrl || "-"} href={user.coverUrl || undefined} mono />
        </Section>
      ) : null}

      <Section title="Redes sociales">
        <DataCell label="Instagram" value={user.socialInstagram || "-"} href={user.socialInstagram ? `https://instagram.com/${user.socialInstagram.replace(/^@/, "")}` : undefined} />
        <DataCell label="Spotify" value={user.socialSpotify || "-"} href={user.socialSpotify || undefined} />
        <DataCell label="YouTube" value={user.socialYoutube || "-"} href={user.socialYoutube || undefined} />
      </Section>

      {socials.length > 0 ? (
        <div className="-mt-2 flex flex-wrap gap-2">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:border-[color:rgb(var(--ui-glow-primary)/0.4)]"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              Abrir {s.label}
            </a>
          ))}
        </div>
      ) : null}

      <Section title="Actividad">
        <DataCell
          label="Estado"
          value={isOnline(user.lastSeenAt) ? "En linea" : "Inactivo"}
          tone={isOnline(user.lastSeenAt) ? "ok" : "muted"}
        />
        <DataCell label="Total visitas" value={String(user.visitCount ?? 0)} />
        <DataCell label="Primera vez" value={formatDateMaybe(user.firstSeenAt)} />
        <DataCell label="Ultima vez" value={formatRelativeMaybe(user.lastSeenAt)} />
        <DataCell label="Ultimo login" value={formatRelativeMaybe(user.lastLoginAt)} />
        <DataCell label="Registrado" value={formatDate(user.createdAt)} />
        <DataCell label="Actualizado" value={formatRelative(user.updatedAt)} />
      </Section>
    </div>
  );
}

function TrackingView({ user }: { user: AdminUser }) {
  const onMap = user.lastGeoLat !== null && user.lastGeoLon !== null
    ? `https://www.openstreetmap.org/?mlat=${user.lastGeoLat}&mlon=${user.lastGeoLon}#map=10/${user.lastGeoLat}/${user.lastGeoLon}`
    : null;

  return (
    <div className="space-y-5">
      <Section title="Red e IP">
        <DataCell label="IP publica" value={user.lastIp || "-"} mono />
        <DataCell label="ISP" value={user.lastIsp || "-"} />
        <DataCell label="Pais" value={user.lastCountry || "-"} />
        <DataCell label="Region" value={user.lastRegion || "-"} />
        <DataCell label="Ciudad" value={user.lastCityGeo || "-"} />
        <DataCell
          label="Coordenadas"
          value={user.lastGeoLat !== null && user.lastGeoLon !== null ? `${user.lastGeoLat}, ${user.lastGeoLon}` : "-"}
          href={onMap || undefined}
        />
        <DataCell label="Conexion" value={user.lastConnection || "-"} />
        <DataCell label="DNT" value={user.lastDnt || "-"} />
      </Section>

      <Section title="Navegador">
        <DataCell label="Navegador" value={[user.lastBrowser, user.lastBrowserVersion].filter(Boolean).join(" ") || "-"} />
        <DataCell label="Sistema operativo" value={[user.lastOs, user.lastOsVersion].filter(Boolean).join(" ") || "-"} />
        <DataCell label="Plataforma" value={user.lastPlatform || "-"} />
        <DataCell label="Idioma" value={user.lastLanguage || "-"} />
        <DataCell label="Idiomas aceptados" value={user.lastLanguages || "-"} />
        <DataCell label="Zona horaria" value={user.lastTimezone || "-"} />
        <DataCell
          label="UTC offset"
          value={user.lastTimezoneOffset !== null ? `${user.lastTimezoneOffset >= 0 ? "+" : ""}${user.lastTimezoneOffset} min` : "-"}
        />
        <DataCell label="Referrer" value={user.lastReferrer || "-"} href={user.lastReferrer || undefined} mono />
      </Section>

      <Section title="Dispositivo">
        <DataCell label="Tipo" value={user.lastDeviceType || "-"} />
        <DataCell label="Fabricante" value={user.lastDeviceVendor || "-"} />
        <DataCell label="Pantalla" value={formatScreen(user.lastScreenWidth, user.lastScreenHeight)} />
        <DataCell label="Viewport" value={formatScreen(user.lastViewportWidth, user.lastViewportHeight)} />
        <DataCell label="Densidad pixeles" value={formatNumber(user.lastPixelRatio, "x")} />
        <DataCell label="Profundidad color" value={formatNumber(user.lastColorDepth, " bits")} />
        <DataCell label="CPU cores" value={formatNumber(user.lastCpuCores)} />
        <DataCell label="Memoria" value={user.lastMemoryGb !== null ? `${user.lastMemoryGb} GB` : "-"} />
        <DataCell label="Touch points" value={formatNumber(user.lastTouchPoints)} />
      </Section>

      {user.lastUserAgent ? (
        <Section title="User-Agent" cols={1}>
          <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3">
            <p className="break-all font-mono text-xs leading-relaxed text-[var(--ui-text)]">
              {user.lastUserAgent}
            </p>
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function VisitsView({ visits, loading }: { visits: AdminVisit[]; loading: boolean }) {
  if (loading && visits.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]" />
        ))}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[var(--ui-text)]">Sin visitas registradas todavia.</p>
        <p className="mt-1 text-xs text-[var(--ui-muted)]">Las visitas se registran al iniciar sesion y al cargar la app.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visits.map((v) => {
        const sourceLabel = v.source === "login"
          ? "Login"
          : v.source === "register"
            ? "Registro"
            : v.source === "client"
              ? "Cliente"
              : v.source;
        const device = [v.browser, v.os].filter(Boolean).join(" / ") || "-";
        const place = [v.city_geo, v.region, v.country].filter(Boolean).join(", ") || "-";
        return (
          <div key={v.id} className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  v.source === "login" || v.source === "register"
                    ? "bg-[color:rgb(var(--ui-glow-primary)/0.18)] text-[var(--ui-primary)]"
                    : "bg-[var(--ui-surface)] text-[var(--ui-muted)]"
                }`}>
                  {sourceLabel}
                </span>
                <span className="text-xs font-semibold text-[var(--ui-text)]">
                  {formatRelative(v.occurred_at)}
                </span>
                <span className="text-[10px] text-[var(--ui-muted)]">·</span>
                <span className="text-[10px] text-[var(--ui-muted)]">{formatDate(v.occurred_at)}</span>
              </div>
              {v.device_type ? (
                <span className="rounded-full border border-[color:var(--ui-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-muted)]">
                  {v.device_type}
                </span>
              ) : null}
            </div>
            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              <p><span className="text-[var(--ui-muted)]">IP:</span> <span className="font-mono">{v.ip || "-"}</span></p>
              <p className="truncate"><span className="text-[var(--ui-muted)]">Lugar:</span> {place}</p>
              <p className="truncate"><span className="text-[var(--ui-muted)]">Dispositivo:</span> {device}</p>
              <p className="truncate"><span className="text-[var(--ui-muted)]">Pantalla:</span> {formatScreen(v.screen_width, v.screen_height)} · viewport {formatScreen(v.viewport_width, v.viewport_height)}</p>
              {v.timezone ? <p className="truncate"><span className="text-[var(--ui-muted)]">TZ:</span> {v.timezone}</p> : null}
              {v.language ? <p className="truncate"><span className="text-[var(--ui-muted)]">Idioma:</span> {v.language}</p> : null}
              {v.page_path ? <p className="col-span-full truncate"><span className="text-[var(--ui-muted)]">Pagina:</span> <span className="font-mono">{v.page_path}</span></p> : null}
              {v.referrer ? <p className="col-span-full truncate"><span className="text-[var(--ui-muted)]">Referrer:</span> <span className="font-mono">{v.referrer}</span></p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children, cols = 2 }: { title: string; children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const gridClass = cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">{title}</p>
      <div className={`mt-2 grid gap-2 ${gridClass}`}>
        {children}
      </div>
    </section>
  );
}

function DataCell({
  label,
  value,
  mono,
  href,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
  tone?: "ok" | "warn" | "danger" | "muted";
}) {
  const toneClass =
    tone === "ok"
      ? "border-[color:rgb(var(--ui-glow-accent)/0.45)] bg-[color:rgb(var(--ui-glow-accent)/0.10)]"
      : tone === "warn"
        ? "border-[color:rgb(var(--ui-glow-primary)/0.45)] bg-[color:rgb(var(--ui-glow-primary)/0.10)]"
        : tone === "danger"
          ? "border-[color:rgb(var(--ui-glow-danger)/0.45)] bg-[color:rgb(var(--ui-glow-danger)/0.10)]"
          : "border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]";

  const display = (
    <p className={`mt-1 break-words text-sm font-medium text-[var(--ui-text)] ${mono ? "font-mono text-xs" : ""}`}>
      {value}
    </p>
  );

  return (
    <div className={`rounded-2xl border px-3.5 py-2.5 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-muted)]">{label}</p>
      {href && value !== "-" ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`mt-1 block break-words text-sm font-medium text-[var(--ui-text)] hover:text-[var(--ui-primary)] ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </a>
      ) : (
        display
      )}
    </div>
  );
}

function EditView({
  draft,
  onUpdate,
}: {
  draft: UserDraft;
  onUpdate: <K extends keyof UserDraft>(key: K, value: UserDraft[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Identidad</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup label="Nombre">
            <input
              value={draft.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Nombre artistico">
            <input
              value={draft.stageName}
              onChange={(e) => onUpdate("stageName", e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Rol">
            <select
              value={draft.role}
              onChange={(e) => onUpdate("role", e.target.value === "admin" ? "admin" : "user")}
              className={inputClass}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Tagline">
            <input
              value={draft.tagline}
              onChange={(e) => onUpdate("tagline", e.target.value)}
              placeholder="Frase corta que te describe"
              className={inputClass}
            />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Contacto</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup label="Correo">
            <input
              type="email"
              value={draft.email}
              onChange={(e) => onUpdate("email", e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Telefono">
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => onUpdate("phone", e.target.value)}
              placeholder="+1 809 555 0000"
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Ubicacion">
            <input
              value={draft.location}
              onChange={(e) => onUpdate("location", e.target.value)}
              placeholder="Ciudad, pais"
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Sitio web">
            <input
              type="url"
              value={draft.websiteUrl}
              onChange={(e) => onUpdate("websiteUrl", e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Perfil musical</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FieldGroup label="Tipo de musico">
            <input
              value={draft.musicianType}
              onChange={(e) => onUpdate("musicianType", e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Instrumento">
            <input
              value={draft.primaryInstrument}
              onChange={(e) => onUpdate("primaryInstrument", e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Genero">
            <input
              value={draft.genre}
              onChange={(e) => onUpdate("genre", e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Bio" span={2}>
          <textarea
            rows={3}
            value={draft.bio}
            onChange={(e) => onUpdate("bio", e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </FieldGroup>
      </section>

      <section className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Redes sociales</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FieldGroup label="Instagram">
            <input
              value={draft.socialInstagram}
              onChange={(e) => onUpdate("socialInstagram", e.target.value)}
              placeholder="@usuario"
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Spotify">
            <input
              value={draft.socialSpotify}
              onChange={(e) => onUpdate("socialSpotify", e.target.value)}
              placeholder="URL del perfil"
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="YouTube">
            <input
              value={draft.socialYoutube}
              onChange={(e) => onUpdate("socialYoutube", e.target.value)}
              placeholder="URL del canal"
              className={inputClass}
            />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Seguridad</p>
        <FieldGroup label="Nueva contrasena (opcional, min 6)" span={2}>
          <input
            type="password"
            value={draft.password}
            onChange={(e) => onUpdate("password", e.target.value)}
            placeholder="Dejar vacio para no cambiar"
            className={inputClass}
          />
        </FieldGroup>
      </section>
    </div>
  );
}
