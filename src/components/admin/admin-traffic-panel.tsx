"use client";

import { animate, stagger } from "animejs";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TrafficVisit = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  occurredAt: string;
  source: string;
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
  deviceVendor: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  pixelRatio: number | null;
  colorDepth: number | null;
  language: string | null;
  languages: string | null;
  timezone: string | null;
  timezoneOffset: number | null;
  referrer: string | null;
  pagePath: string | null;
  country: string | null;
  region: string | null;
  cityGeo: string | null;
  isp: string | null;
  geoLat: number | null;
  geoLon: number | null;
  connection: string | null;
  platform: string | null;
  cpuCores: number | null;
  memoryGb: number | null;
  touchPoints: number | null;
  dnt: string | null;
};

type RankItem = {
  label: string;
  value: number;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-DO", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "ahora";
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return formatDate(value);
}

function joinParts(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ") || "-";
}

function formatScreen(width: number | null, height: number | null) {
  return width && height ? `${width}x${height}` : "-";
}

function sourceLabel(source: string) {
  if (source === "register") return "Registro";
  if (source === "login") return "Login";
  if (source === "client") return "Visita";
  return source || "-";
}

function sourceTone(source: string) {
  if (source === "register") return "border-[color:rgb(var(--ui-glow-accent)/0.42)] bg-[color:rgb(var(--ui-glow-accent)/0.12)] text-[var(--ui-accent)]";
  if (source === "login") return "border-[color:rgb(var(--ui-glow-primary)/0.42)] bg-[color:rgb(var(--ui-glow-primary)/0.12)] text-[var(--ui-primary)]";
  return "border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-muted)]";
}

function countBy(items: TrafficVisit[], picker: (visit: TrafficVisit) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = picker(item)?.trim() || "Desconocido";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function ratio(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(3, Math.round((value / total) * 100));
}

function initials(value: string | null) {
  const source = (value ?? "Visitante").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? "V"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function deviceLabel(value: string | null) {
  if (value === "mobile") return "Movil";
  if (value === "tablet") return "Tablet";
  if (value === "desktop") return "Desktop";
  if (value === "bot") return "Bot";
  return "Otro";
}

function browserAccent(index: number) {
  const tones = [
    "bg-[var(--ui-primary)]",
    "bg-[var(--ui-accent)]",
    "bg-[var(--ui-danger)]",
    "bg-[color:rgb(var(--ui-glow-primary)/0.55)]",
  ];
  return tones[index % tones.length];
}

function getHourlyBuckets(visits: TrafficVisit[]) {
  const now = new Date();
  const buckets = Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(now);
    date.setHours(now.getHours() - (11 - index), 0, 0, 0);
    return {
      label: date.toLocaleTimeString("es-DO", { hour: "2-digit" }),
      start: date.getTime(),
      end: date.getTime() + 60 * 60 * 1000,
      value: 0,
    };
  });

  for (const visit of visits) {
    const time = new Date(visit.occurredAt).getTime();
    if (!Number.isFinite(time)) continue;
    const bucket = buckets.find((item) => time >= item.start && time < item.end);
    if (bucket) bucket.value += 1;
  }

  const max = Math.max(...buckets.map((item) => item.value), 1);
  return buckets.map((item) => ({ ...item, height: ratio(item.value, max) }));
}

export function AdminTrafficPanel() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [visits, setVisits] = useState<TrafficVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const loadTraffic = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/traffic?limit=220", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { visits?: TrafficVisit[]; generatedAt?: string; message?: string }
        | null;

      if (!response.ok || !Array.isArray(payload?.visits)) {
        setErrorMessage(payload?.message ?? "No pudimos cargar el trafico.");
        return;
      }

      setVisits(payload.visits);
      setLastUpdate(payload.generatedAt ?? new Date().toISOString());
      setErrorMessage(null);
    } catch {
      setErrorMessage("No pudimos cargar el trafico.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTraffic();
    const timer = window.setInterval(() => {
      void loadTraffic();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [loadTraffic]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = root.querySelectorAll("[data-traffic-animate]");
    const animation = animate(nodes, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.98, 1],
      delay: stagger(48),
      duration: 720,
      ease: "outCubic",
    });
    return () => {
      animation.revert();
    };
  }, []);

  const firstVisitId = visits[0]?.id ?? "";
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !firstVisitId || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = root.querySelectorAll("[data-live-row]");
    const animation = animate(rows, {
      opacity: [0, 1],
      translateX: [10, 0],
      delay: stagger(20),
      duration: 420,
      ease: "outCubic",
    });
    return () => {
      animation.revert();
    };
  }, [firstVisitId, visits.length]);

  const stats = useMemo(() => {
    const now = Date.now();
    const recent = visits.filter((visit) => {
      const time = new Date(visit.occurredAt).getTime();
      return Number.isFinite(time) && now - time <= 15 * 60 * 1000;
    });
    const lastHour = visits.filter((visit) => {
      const time = new Date(visit.occurredAt).getTime();
      return Number.isFinite(time) && now - time <= 60 * 60 * 1000;
    });
    const authenticated = visits.filter((visit) => visit.userId).length;
    const countries = new Set(visits.map((visit) => visit.country).filter(Boolean));
    const bots = visits.filter((visit) => visit.deviceType === "bot").length;
    return {
      total: visits.length,
      recent: recent.length,
      lastHour: lastHour.length,
      authenticated,
      anonymous: visits.length - authenticated,
      countries: countries.size,
      bots,
    };
  }, [visits]);

  const countryRanks = useMemo(() => countBy(visits, (visit) => visit.country).slice(0, 5), [visits]);
  const browserRanks = useMemo(() => countBy(visits, (visit) => visit.browser).slice(0, 5), [visits]);
  const deviceRanks = useMemo(() => countBy(visits, (visit) => deviceLabel(visit.deviceType)).slice(0, 4), [visits]);
  const hourlyBuckets = useMemo(() => getHourlyBuckets(visits), [visits]);
  const latest = visits[0] ?? null;

  return (
    <main ref={rootRef} className="min-h-screen bg-[var(--ui-bg)] px-4 pb-12 pt-24 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <header
          data-traffic-animate
          className="overflow-hidden rounded-[2rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_24px_70px_-36px_rgb(var(--ui-glow-primary)/0.5)]"
        >
          <div className="relative grid gap-6 border-b border-[color:var(--ui-border)] bg-gradient-to-br from-[color:rgb(var(--ui-glow-primary)/0.16)] via-[var(--ui-surface)] to-[color:rgb(var(--ui-glow-accent)/0.14)] p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--ui-glow-accent)/0.42)] bg-[color:rgb(var(--ui-glow-accent)/0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ui-accent)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--ui-accent)]" />
                  Live
                </span>
                <span className="rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1 text-[11px] font-semibold text-[var(--ui-muted)]">
                  Actualiza cada 8s
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-5xl">
                Centro de trafico RitmoHub
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ui-muted)]">
                Visitas, registros, ubicacion aproximada, navegador y datos del dispositivo en una sola vista de control.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadTraffic()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--ui-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-on-primary)] shadow-[0_14px_28px_-18px_rgb(var(--ui-glow-primary)/0.8)] transition hover:bg-[var(--ui-primary-hover)]"
                >
                  <RefreshIcon />
                  Refrescar
                </button>
                <Link
                  href="/dashboard/admin/users"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[color:rgb(var(--ui-glow-primary)/0.45)] hover:bg-[var(--ui-surface-soft)]"
                >
                  <UsersIcon />
                  Usuarios
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[color:rgb(var(--ui-glow-primary)/0.45)] hover:bg-[var(--ui-surface-soft)]"
                >
                  <BackIcon />
                  Volver
                </Link>
              </div>
            </div>

            <LiveCard latest={latest} lastUpdate={lastUpdate} />
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <MetricCard label="Ahora" value={stats.recent} hint="ultimos 15 min" tone="primary" icon={<PulseIcon />} />
            <MetricCard label="Ultima hora" value={stats.lastHour} hint={`${stats.total} en memoria`} tone="accent" icon={<ClockIcon />} />
            <MetricCard label="Identificados" value={stats.authenticated} hint={`${stats.anonymous} anonimos`} tone="neutral" icon={<ShieldIcon />} />
            <MetricCard label="Paises" value={stats.countries} hint={`${stats.bots} bots detectados`} tone="danger" icon={<GlobeIcon />} />
          </div>
        </header>

        {errorMessage ? (
          <div
            data-traffic-animate
            className="rounded-2xl border border-[color:rgb(var(--ui-glow-danger)/0.45)] bg-[color:rgb(var(--ui-glow-danger)/0.08)] px-4 py-3 text-sm text-[var(--ui-danger)]"
          >
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.8fr)]">
          <div data-traffic-animate className="rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Actividad</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--ui-text)]">Pulso de las ultimas 12 horas</h2>
              </div>
              <p className="rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--ui-muted)]">
                {formatDate(lastUpdate)}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]">
              <div className="grid h-52 grid-cols-12 items-end gap-1.5 px-3 pb-4 pt-6 sm:gap-2 sm:px-4">
                {hourlyBuckets.map((bucket, index) => (
                  <div key={bucket.start} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                    <div className="relative flex h-full w-full items-end justify-center">
                      <div
                        className="w-full max-w-8 rounded-t-xl bg-gradient-to-t from-[var(--ui-primary)] to-[var(--ui-accent)] shadow-[0_10px_22px_-14px_rgb(var(--ui-glow-primary)/0.8)] transition-[height] duration-500"
                        style={{ height: `${bucket.height}%` }}
                        title={`${bucket.value} visitas`}
                      />
                    </div>
                    <span className={`${index % 2 ? "hidden sm:inline" : "inline"} truncate text-[9px] font-semibold text-[var(--ui-muted)] sm:text-[10px]`}>
                      {bucket.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div data-traffic-animate className="rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Mapa operativo</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--ui-text)]">Origen del trafico</h2>
              </div>
              <GlobeIcon />
            </div>

            <div className="relative mt-5 aspect-[1.75] overflow-hidden rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]">
              <div className="absolute inset-6 rounded-full border border-[color:rgb(var(--ui-glow-primary)/0.20)]" />
              <div className="absolute inset-12 rounded-full border border-[color:rgb(var(--ui-glow-accent)/0.22)]" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ui-primary)] shadow-[0_0_24px_rgb(var(--ui-glow-primary)/0.65)]" />
              {countryRanks.slice(0, 5).map((item, index) => (
                <TrafficDot key={item.label} item={item} index={index} total={stats.total} />
              ))}
              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/90 px-3 py-2 backdrop-blur-md">
                <p className="truncate text-xs font-semibold text-[var(--ui-text)]">
                  Top: {countryRanks[0]?.label ?? "Sin datos"} {countryRanks[0] ? `(${countryRanks[0].value})` : ""}
                </p>
              </div>
            </div>
            <MapLegend items={countryRanks} total={stats.total} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <RankPanel title="Paises" items={countryRanks} total={stats.total} />
          <RankPanel title="Navegadores" items={browserRanks} total={stats.total} />
          <RankPanel title="Dispositivos" items={deviceRanks} total={stats.total} />
        </section>

        <section data-traffic-animate className="overflow-hidden rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--ui-border)] px-4 py-4 sm:px-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Timeline</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--ui-text)]">Entradas recientes</h2>
            </div>
            <span className="rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--ui-muted)]">
              {visits.length} eventos
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-3 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-[var(--ui-surface-soft)]" />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-[var(--ui-text)]">Todavia no hay trafico registrado.</p>
              <p className="mt-1 text-xs text-[var(--ui-muted)]">El panel se llenara cuando entren visitantes reales.</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--ui-border)]">
              {visits.map((visit) => (
                <VisitRow key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function LiveCard({ latest, lastUpdate }: { latest: TrafficVisit | null; lastUpdate: string | null }) {
  return (
    <aside className="rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/92 p-4 shadow-[0_18px_40px_-28px_rgb(0_0_0/0.55)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ui-muted)]">Ultima senal</p>
        <span className="rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ui-accent)]">
          Online
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-accent)] text-sm font-bold text-[var(--ui-on-primary)] shadow-[0_16px_26px_-18px_rgb(var(--ui-glow-primary)/0.9)]">
          {initials(latest?.userName ?? latest?.ip ?? null)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{latest?.userName ?? "Visitante anonimo"}</p>
          <p className="truncate font-mono text-xs text-[var(--ui-muted)]">{latest?.ip ?? "sin ip"}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-xs">
        <InfoLine label="Pagina" value={latest?.pagePath ?? "/"} mono />
        <InfoLine label="Lugar" value={joinParts([latest?.cityGeo, latest?.region, latest?.country])} />
        <InfoLine label="Navegador" value={joinParts([latest?.browser, latest?.browserVersion])} />
        <InfoLine label="Refresco" value={formatDate(lastUpdate)} />
      </dl>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "primary" | "accent" | "neutral" | "danger";
  icon: ReactNode;
}) {
  const tones = {
    primary: "from-[color:rgb(var(--ui-glow-primary)/0.18)] to-[color:rgb(var(--ui-glow-primary)/0.04)] text-[var(--ui-primary)]",
    accent: "from-[color:rgb(var(--ui-glow-accent)/0.18)] to-[color:rgb(var(--ui-glow-accent)/0.04)] text-[var(--ui-accent)]",
    neutral: "from-[var(--ui-surface-soft)] to-[var(--ui-surface)] text-[var(--ui-text)]",
    danger: "from-[color:rgb(var(--ui-glow-danger)/0.16)] to-[color:rgb(var(--ui-glow-danger)/0.04)] text-[var(--ui-danger)]",
  };

  return (
    <article className={`rounded-[1.25rem] border border-[color:var(--ui-border)] bg-gradient-to-br ${tones[tone]} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ui-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ui-text)]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--ui-muted)]">{hint}</p>
    </article>
  );
}

function TrafficDot({ item, index, total }: { item: RankItem; index: number; total: number }) {
  const positions = [
    ["18%", "38%"],
    ["69%", "26%"],
    ["78%", "58%"],
    ["42%", "67%"],
    ["31%", "24%"],
  ];
  const [left, top] = positions[index] ?? ["50%", "50%"];
  const size = 10 + Math.min(18, item.value * 2);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
      <div
        className="flex items-center justify-center rounded-full border-2 border-[var(--ui-surface)] bg-[var(--ui-accent)] text-[10px] font-bold text-[var(--ui-on-primary)] shadow-[0_0_0_6px_rgb(var(--ui-glow-accent)/0.14),0_0_26px_rgb(var(--ui-glow-accent)/0.55)]"
        style={{ width: size, height: size }}
        title={`${index + 1}. ${item.label}: ${item.value} visitas, ${ratio(item.value, total)}%`}
      >
        {index + 1}
      </div>
    </div>
  );
}

function MapLegend({ items, total }: { items: RankItem[]; total: number }) {
  if (items.length === 0) {
    return (
      <p className="mt-3 rounded-2xl border border-dashed border-[color:var(--ui-border)] px-4 py-3 text-center text-xs text-[var(--ui-muted)]">
        Aun no hay paises detectados.
      </p>
    );
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.slice(0, 4).map((item, index) => (
        <div key={item.label} className="min-w-0 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs font-semibold text-[var(--ui-text)]">
              {index + 1}. {item.label}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-[var(--ui-muted)]">{ratio(item.value, total)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankPanel({ title, items, total }: { title: string; items: RankItem[]; total: number }) {
  return (
    <article data-traffic-animate className="rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--ui-text)]">{title}</h2>
        <span className="text-xs font-semibold text-[var(--ui-muted)]">Top {items.length || 0}</span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--ui-border)] px-4 py-6 text-center text-xs text-[var(--ui-muted)]">
            Sin datos
          </p>
        ) : (
          items.map((item, index) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-semibold text-[var(--ui-text)]">{item.label}</span>
                <span className="font-mono text-[var(--ui-muted)]">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--ui-surface-soft)]">
                <div
                  className={`h-full rounded-full ${browserAccent(index)} transition-[width] duration-500`}
                  style={{ width: `${ratio(item.value, total)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function VisitRow({ visit }: { visit: TrafficVisit }) {
  return (
    <article
      data-live-row
      className="grid gap-4 px-4 py-4 transition hover:bg-[var(--ui-surface-soft)] sm:px-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.05fr)]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${sourceTone(visit.source)}`}>
            {sourceLabel(visit.source)}
          </span>
          <span className="text-xs font-semibold text-[var(--ui-text)]">{formatRelative(visit.occurredAt)}</span>
          <span className="text-[11px] text-[var(--ui-muted)]">{formatDate(visit.occurredAt)}</span>
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ui-surface-soft)] text-xs font-bold text-[var(--ui-text)]">
            {initials(visit.userName ?? visit.ip)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{visit.userName || "Visitante anonimo"}</p>
            <p className="truncate font-mono text-xs text-[var(--ui-muted)]">{visit.userEmail || visit.ip || "-"}</p>
          </div>
        </div>
        <p className="mt-3 truncate rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 font-mono text-xs text-[var(--ui-muted)]">
          {visit.pagePath || "/"}
        </p>
      </div>

      <div className="grid content-start gap-1.5 text-xs text-[var(--ui-muted)]">
        <InfoLine label="IP" value={visit.ip || "-"} mono />
        <InfoLine label="Lugar" value={joinParts([visit.cityGeo, visit.region, visit.country])} />
        <InfoLine label="ISP" value={visit.isp || "-"} />
        <InfoLine
          label="Coordenadas"
          value={visit.geoLat !== null && visit.geoLon !== null ? `${visit.geoLat}, ${visit.geoLon}` : "-"}
          mono
        />
      </div>

      <div className="grid content-start gap-1.5 text-xs text-[var(--ui-muted)]">
        <InfoLine label="Navegador" value={joinParts([visit.browser, visit.browserVersion])} />
        <InfoLine label="Sistema" value={joinParts([visit.os, visit.osVersion])} />
        <InfoLine label="Dispositivo" value={joinParts([deviceLabel(visit.deviceType), visit.deviceVendor])} />
        <InfoLine label="Pantalla" value={`${formatScreen(visit.screenWidth, visit.screenHeight)} - viewport ${formatScreen(visit.viewportWidth, visit.viewportHeight)}`} />
        <InfoLine label="Idioma/TZ" value={joinParts([visit.language, visit.timezone])} />
        <InfoLine label="Plataforma" value={joinParts([visit.platform, visit.connection])} />
      </div>
    </article>
  );
}

function InfoLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="grid min-w-0 grid-cols-[5.9rem_minmax(0,1fr)] gap-2 sm:grid-cols-[6.8rem_minmax(0,1fr)]">
      <span className="text-[var(--ui-muted)]/75">{label}</span>
      <span className={`truncate text-[var(--ui-text)] ${mono ? "font-mono" : ""}`}>{value}</span>
    </p>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.6 2.9 8.6 7 10 4.1-1.4 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
