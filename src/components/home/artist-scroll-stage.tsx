"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ShowcaseItem = {
  id: string;
  name: string;
  category: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  fullImage: string;
  videoUrl: string;
  gallery: string[];
  accent: string;
  secondary: string;
};

const DEFAULT_ARTIST_IMAGE = "/artists/default-artist.svg";

const CARD_COOLDOWN_MS = 220;
const WAVE_MS = 860;
const WAVE_HIDE_DELAY_MS = 150;
const DETAIL_FADE_OUT_MS = 240;
const VIEWPORT_EDGE_TOLERANCE = 12;

const showcaseItems: ShowcaseItem[] = [
  {
    id: "adrian-multi-versales",
    name: "Adrian Alcantar Multi-versales",
    category: "Banda destacada",
    subtitle: "Santo Domingo",
    description:
      "Son legendarios porque son poderosos: cuando suben al escenario invocan un pollito amarillo y desatan una energia brutal que enciende a todo el publico.",
    thumbnail: "/artists/adrian-multiversal-banner.png",
    fullImage: "/artists/adrian-multiversal-banner.png",
    videoUrl: "https://www.youtube.com/watch?v=QK8mJJJvaes",
    gallery: [
      "/artists/adrian-bajista.jpg",
      "/artists/adrian-baterista.jpg",
      "/artists/adrian-cantante.jpg",
      "/artists/adrian-guitarrista.jpg",
    ],
    accent: "#3B82F6",
    secondary: "#06B6D4",
  },
  {
    id: "itlenos",
    name: "Itlenos",
    category: "Banda local",
    subtitle: "Santo Domingo",
    description:
      "Itlenos es una banda dominicana con fuerza en tarima, sonido moderno y una propuesta que mezcla energia, presencia y autenticidad en cada presentacion.",
    thumbnail: "/artists/itlenos-portada.png",
    fullImage: "/artists/itlenos-portada.png",
    videoUrl: "https://www.youtube.com/watch?v=weRHyjj34ZE",
    gallery: [
      "/artists/itlenos-baterista.jpg",
      "/artists/itlenos-guitarrista.jpg",
      "/artists/itlenos-bajista.jpg",
      "/artists/itlenos-cantante.jpg",
    ],
    accent: "#60A5FA",
    secondary: "#22D3EE",
  },
  {
    id: "dawwing-choppa",
    name: "Darwing Choppa",
    category: "Urbano / Trap",
    subtitle: "Santo Domingo",
    description:
      "Darwing Choppa combina actitud de calle, presencia escenica y un sonido urbano directo para conectar con el publico desde el primer beat.",
    thumbnail: "/artists/dawwing-choppa-pfp.jpg",
    fullImage: "/artists/dawwing-choppa-pfp.jpg",
    videoUrl: "https://www.youtube.com/watch?v=acEOASYioGY",
    gallery: ["/artists/dawwing-choppa-banner.jpg"],
    accent: "#F97316",
    secondary: "#EF4444",
  },
  {
    id: "jimmy-jackson",
    name: "Jimmy Jackson",
    category: "Tributo / Pop",
    subtitle: "Santo Domingo",
    description:
      "Jimmy Jackson es una famosa estrella de pop, pasos iconicos, presencia electrica y un show que revive su estilo con fuerza y precision.",
    thumbnail: "/artists/jimmy-jackson-foto.jpg",
    fullImage: "/artists/jimmy-jackson-foto.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Rht7rBHuXW8",
    gallery: ["/artists/jimmy-jackson-banner.jpg"],
    accent: "#A855F7",
    secondary: "#EC4899",
  },
  {
    id: "numeosis",
    name: "Numeosis",
    category: "Pop / Performance",
    subtitle: "Santo Domingo",
    description:
      "Numeosis es una propuesta escenica intensa, con imagen poderosa, presencia de tarima y un estilo que conecta de inmediato con el publico.",
    thumbnail: "/artists/numeosis-portada.png",
    fullImage: "/artists/numeosis-portada.png",
    videoUrl: "https://www.youtube.com/watch?v=oygrmJFKYZY",
    gallery: ["/artists/numeosis-banner.png"],
    accent: "#38BDF8",
    secondary: "#6366F1",
  },
  {
    id: "ashanty-gaynor",
    name: "Ashanty Gaynor",
    category: "Pop / Performance",
    subtitle: "Santo Domingo",
    description:
      "Ashanty Gaynor destaca por su presencia escenica, interpretacion intensa y una puesta en escena que conecta rapido con el publico.",
    thumbnail: "/artists/ashanty-gaynor-pfp.jpg",
    fullImage: "/artists/ashanty-gaynor-pfp.jpg",
    videoUrl: "https://www.youtube.com/watch?v=fHI8X4OXluQ",
    gallery: ["/artists/ashanty-gaynor-banner.jpg"],
    accent: "#F43F5E",
    secondary: "#FB7185",
  },
  {
    id: "fernando-sheeran",
    name: "Fernando Sheeran",
    category: "Pop / Acustico",
    subtitle: "Santo Domingo",
    description:
      "Fernando Sheeran combina una vibra romantica con energia en vivo, letras cercanas y un estilo pop acustico que conecta rapido con la audiencia.",
    thumbnail: "/artists/fernando-sheeran-foto.jpg",
    fullImage: "/artists/fernando-sheeran-foto.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Q8mG0JfN2X8",
    gallery: ["/artists/fernando-sheeran-banner.jpg"],
    accent: "#E879F9",
    secondary: "#F472B6",
  },
];

type WavePhase = "idle" | "opening" | "closing";

export function ArtistScrollStage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const waveTimerRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [wavePreviewIndex, setWavePreviewIndex] = useState<number | null>(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [wavePhase, setWavePhase] = useState<WavePhase>("idle");
  const [isStageInView, setIsStageInView] = useState(false);
  const [hasCompletedStage, setHasCompletedStage] = useState(false);

  const canUsePortal = typeof window !== "undefined";
  const activeItem = showcaseItems[currentIndex] ?? showcaseItems[0];
  const waveItem = showcaseItems[detailIndex ?? wavePreviewIndex ?? currentIndex] ?? showcaseItems[0];
  const detailItem = detailIndex !== null ? showcaseItems[detailIndex] : null;
  const detailImage = detailItem?.thumbnail ?? detailItem?.fullImage ?? DEFAULT_ARTIST_IMAGE;

  const isDetailOpen = detailIndex !== null;
  const isOverlayActive = isDetailOpen || wavePhase !== "idle";
  const isStageHijackActive = isStageInView && !isOverlayActive && !hasCompletedStage;
  const shouldFreezeSmoothScroll = isOverlayActive || isStageHijackActive;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < showcaseItems.length - 1;

  const clearTimers = useCallback(() => {
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (waveTimerRef.current !== null) {
      window.clearTimeout(waveTimerRef.current);
      waveTimerRef.current = null;
    }
  }, []);

  const moveToIndex = useCallback((nextIndex: number) => {
    const clamped = Math.max(0, Math.min(showcaseItems.length - 1, nextIndex));
    setCurrentIndex(clamped);
    const rail = railRef.current;
    if (!rail) return;
    const target = rail.querySelector<HTMLElement>(
      `[data-showcase-index="${clamped}"]`,
    );
    if (!target) return;
    const railRect = rail.getBoundingClientRect();
    const cardRect = target.getBoundingClientRect();
    const delta =
      cardRect.left + cardRect.width / 2 - (railRect.left + railRect.width / 2);
    rail.scrollTo({ left: rail.scrollLeft + delta, behavior: "smooth" });
  }, []);

  const isSectionActiveInViewport = useCallback(() => {
    const node = sectionRef.current;
    if (!node || typeof window === "undefined") {
      return false;
    }
    const rect = node.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= VIEWPORT_EDGE_TOLERANCE && rect.bottom <= viewportHeight - VIEWPORT_EDGE_TOLERANCE;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(
      new Event(shouldFreezeSmoothScroll ? "rh-stage-lock" : "rh-stage-unlock"),
    );
    return () => {
      window.dispatchEvent(new Event("rh-stage-unlock"));
    };
  }, [shouldFreezeSmoothScroll]);

  useEffect(() => {
    if (!isOverlayActive) {
      return;
    }
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isOverlayActive]);

  useEffect(() => {
    const syncSectionState = () => {
      setIsStageInView(isSectionActiveInViewport());
      const node = sectionRef.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top > vh * 0.6) {
          setHasCompletedStage(false);
        }
      }
    };
    syncSectionState();
    window.addEventListener("scroll", syncSectionState, { passive: true });
    window.addEventListener("resize", syncSectionState);
    return () => {
      window.removeEventListener("scroll", syncSectionState);
      window.removeEventListener("resize", syncSectionState);
    };
  }, [isSectionActiveInViewport]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const firstCard = rail.querySelector<HTMLElement>('[data-showcase-index="0"]');
    if (!firstCard) return;
    const railRect = rail.getBoundingClientRect();
    const cardRect = firstCard.getBoundingClientRect();
    const delta =
      cardRect.left + cardRect.width / 2 - (railRect.left + railRect.width / 2);
    rail.scrollTo({ left: rail.scrollLeft + delta, behavior: "auto" });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let timer: number | null = null;
    const sync = () => {
      const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-showcase-index]"));
      if (cards.length === 0) return;
      const railRect = rail.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;
      let nearest = 0;
      let best = Number.POSITIVE_INFINITY;
      for (const card of cards) {
        const raw = card.dataset.showcaseIndex;
        if (!raw) continue;
        const n = Number.parseInt(raw, 10);
        if (Number.isNaN(n)) continue;
        const cardRect = card.getBoundingClientRect();
        const c = cardRect.left + cardRect.width / 2;
        const d = Math.abs(c - railCenter);
        if (d < best) {
          best = d;
          nearest = n;
        }
      }
      setCurrentIndex((prev) => (prev === nearest ? prev : nearest));
    };
    const onScroll = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        sync();
        timer = null;
      }, 120);
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      rail.removeEventListener("scroll", onScroll);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (!isStageHijackActive) {
        return;
      }

      if (Math.abs(event.deltaY) < 6) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const isAtLast = currentIndex >= showcaseItems.length - 1;
      const isAtFirst = currentIndex <= 0;
      if (direction > 0 && isAtLast) {
        setHasCompletedStage(true);
        return;
      }

      if (direction < 0 && isAtFirst) {
        return;
      }

      event.preventDefault();

      if (cooldownRef.current) {
        return;
      }
      cooldownRef.current = true;
      moveToIndex(currentIndex + direction);

      cooldownTimerRef.current = window.setTimeout(() => {
        cooldownRef.current = false;
        cooldownTimerRef.current = null;
      }, CARD_COOLDOWN_MS);
    };

    const options: AddEventListenerOptions = { passive: false, capture: true };
    window.addEventListener("wheel", onWheel, options);
    return () => {
      window.removeEventListener("wheel", onWheel, options);
    };
  }, [currentIndex, isStageHijackActive, moveToIndex]);

  const openDetail = useCallback(
    (index: number) => {
      if (isOverlayActive) {
        return;
      }

      clearTimers();
      setWavePreviewIndex(index);
      setWavePhase("opening");

      openTimerRef.current = window.setTimeout(() => {
        setDetailIndex(index);
        setWavePreviewIndex(null);
        openTimerRef.current = null;
      }, WAVE_MS - 24);

      waveTimerRef.current = window.setTimeout(() => {
        setWavePhase("idle");
        waveTimerRef.current = null;
      }, WAVE_MS + WAVE_HIDE_DELAY_MS);
    },
    [clearTimers, isOverlayActive],
  );

  const closeDetail = useCallback(() => {
    if (detailIndex === null || wavePhase !== "idle") {
      return;
    }

    clearTimers();
    setDetailClosing(true);
    setWavePhase("closing");

    closeTimerRef.current = window.setTimeout(() => {
      setDetailIndex(null);
      setDetailClosing(false);
      setWavePreviewIndex(null);
      closeTimerRef.current = null;
    }, DETAIL_FADE_OUT_MS);

    waveTimerRef.current = window.setTimeout(() => {
      setWavePhase("idle");
      waveTimerRef.current = null;
    }, WAVE_MS);
  }, [clearTimers, detailIndex, wavePhase]);

  useEffect(() => {
    if (!isOverlayActive) {
      return;
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDetail();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("keydown", onEsc);
    };
  }, [closeDetail, isOverlayActive]);

  useEffect(
    () => () => {
      clearTimers();
      window.dispatchEvent(new Event("rh-stage-unlock"));
    },
    [clearTimers],
  );

  const stageVars = {
    "--stage-accent": activeItem.accent,
    "--stage-secondary": activeItem.secondary,
  } as CSSProperties;

  const waveVars = {
    "--wave-accent": waveItem.accent,
    "--wave-secondary": waveItem.secondary,
  } as CSSProperties;

  const detailVars = {
    "--artist-accent": detailItem?.accent ?? waveItem.accent,
    "--artist-secondary": detailItem?.secondary ?? waveItem.secondary,
  } as CSSProperties;

  return (
    <>
      <section
        ref={sectionRef}
        id="artist-scroll"
        className="landing-container showcase-stage-section relative mx-auto mt-3 mb-0 h-auto min-h-[44rem] md:h-[calc(100vh-7.5rem)] md:min-h-0 overflow-hidden rounded-[2rem] border border-[color:var(--ui-border)]"
        style={stageVars}
      >
        <div className="showcase-stage-bg absolute inset-0" />
        <div className="showcase-stage-vignette absolute inset-0" />

        <div className="relative z-10 grid h-full items-center justify-center gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="showcase-stage-left flex h-full items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
            <div className="mx-auto w-full max-w-[560px]">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/80">ARTIST SHOWCASE</p>
              <h3 className="mt-2 font-serif text-[clamp(2.1rem,11vw,8rem)] leading-[0.92] tracking-[0.08em] sm:tracking-[0.14em] text-white">
                MUSISEC STAGE
              </h3>
              <p className="mt-6 max-w-[510px] text-[clamp(1rem,0.35vw+0.9rem,1.28rem)] leading-relaxed text-white/90">
                Descubre artistas destacados con una navegacion inmersiva: desliza para recorrer perfiles, estilos y propuesta musical.
              </p>
              <p className="mt-2 max-w-[510px] text-[clamp(0.94rem,0.25vw+0.86rem,1.1rem)] leading-relaxed text-white/76">
                Haz clic en cualquier tarjeta para abrir su perfil completo, ver su galeria y conocer mejor cada integrante.
              </p>
              <div className="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/35 bg-black/18 px-4 py-1.5 text-xs font-semibold text-white/90">
                {activeItem.name}
                <span className="text-white/60">|</span>
                {currentIndex + 1}/{showcaseItems.length}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    if (!canGoPrev) {
                      return;
                    }
                    moveToIndex(currentIndex - 1);
                  }}
                  disabled={!canGoPrev}
                  aria-disabled={!canGoPrev}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white transition hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Artista anterior"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M15 6L9 12L15 18"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    if (!canGoNext) {
                      return;
                    }
                    moveToIndex(currentIndex + 1);
                  }}
                  disabled={!canGoNext}
                  aria-disabled={!canGoNext}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white transition hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Siguiente artista"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M9 6L15 12L9 18"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </aside>

          <div className="flex h-full min-w-0 items-center justify-center px-3 py-8 sm:px-6 lg:px-8">
            <div ref={railRef} className="showcase-rail mx-auto w-full max-w-[1360px]" aria-label="Showcase carousel">
              {showcaseItems.map((item, index) => {
                const distance = Math.abs(index - currentIndex);
                const inactive = distance > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-showcase-index={index}
                    onClick={() => openDetail(index)}
                    className={`showcase-card group ${inactive ? "showcase-card--inactive" : "showcase-card--active"}`}
                    style={{
                      "--card-accent": item.accent,
                      "--card-secondary": item.secondary,
                      transform: inactive
                        ? `scale(${Math.max(0.89, 1 - distance * 0.055)})`
                        : "scale(1)",
                    } as CSSProperties}
                    aria-label={`Open detailed profile for ${item.name}`}
                  >
                    <div className="showcase-card-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <p className="showcase-card-label">
                      {item.name}
                      <span className="ml-1 inline-block">-&gt;</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {canUsePortal && wavePhase !== "idle"
        ? createPortal(
            <div
              className={`artist-wave-screen z-[2147483646] ${wavePhase === "opening" ? "artist-wave-screen--opening" : "artist-wave-screen--closing"}`}
              style={waveVars}
              aria-hidden="true"
            >
              <div className="artist-wave-curtain">
                <div className="artist-wave-screen__crest">
                  <svg className="stage-waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
                    <defs>
                      <path
                        id="artist-wave-path"
                        d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
                      />
                    </defs>
                    <g className="stage-parallax">
                      <use href="#artist-wave-path" x="48" y="0" fill="color-mix(in srgb, var(--wave-secondary) 74%, var(--ui-bg) 26%)" />
                      <use href="#artist-wave-path" x="48" y="3" fill="color-mix(in srgb, var(--wave-accent) 62%, var(--ui-surface-soft) 38%)" />
                      <use href="#artist-wave-path" x="48" y="5" fill="color-mix(in srgb, var(--wave-secondary) 54%, var(--ui-surface-soft) 46%)" />
                      <use href="#artist-wave-path" x="48" y="7" fill="color-mix(in srgb, var(--wave-accent) 82%, var(--ui-bg) 18%)" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {canUsePortal && detailItem
        ? createPortal(
            <div
              className={`artist-detail-shell fixed inset-0 z-[2147483647] overflow-hidden ${detailClosing ? "artist-profile-fade-out" : "artist-profile-fade-in"}`}
              style={detailVars}
            >
              <div className="artist-profile-backdrop absolute inset-0" />

              <article className="relative h-full w-full overflow-y-auto">
                <button
                  type="button"
                  onClick={closeDetail}
                  className="artist-profile-close absolute top-4 right-4 z-30 rounded-xl border px-3 py-1.5 text-sm font-semibold transition"
                  aria-label="Close detail view"
                >
                  X
                </button>

                <div className="grid min-h-full gap-3 lg:gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                  <aside className="artist-detail-left relative flex items-center justify-center overflow-hidden px-4 pt-14 pb-4 sm:px-8 sm:py-8">
                    <p className="artist-detail-vertical hidden lg:block">
                      {detailItem.category} | {detailItem.name}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailImage}
                      alt={detailItem.name}
                      className="block h-[min(56vh,460px)] w-full max-w-[560px] rounded-2xl object-cover sm:h-[min(84vh,900px)]"
                      loading="lazy"
                    />
                  </aside>

                  <section className="artist-detail-right flex min-h-0 flex-col px-4 pb-7 pt-3 sm:px-8 sm:pt-14 lg:px-10">
                    <h4 className="text-[clamp(2rem,1.8vw+1.2rem,3.1rem)] font-semibold tracking-tight text-[var(--ui-text)]">
                      {detailItem.name}
                    </h4>
                    <p className="artist-profile-subtitle mt-1 text-base font-medium">{detailItem.subtitle}</p>

                    <div className="artist-profile-main-card mt-5 rounded-2xl border p-4 shadow-[0_10px_24px_rgb(17_39_60_/0.08)]">
                      <p className="artist-profile-card-kicker text-xs font-semibold tracking-[0.13em]">PROFILE</p>
                      <p className="artist-profile-card-text mt-2 text-lg leading-relaxed">{detailItem.description}</p>
                    </div>

                    <div className="mt-4 grid min-h-0 flex-1 items-start gap-3 sm:grid-cols-2">
                      {detailItem.gallery.length === 1 ? (
                        <article className="artist-profile-media-card relative col-span-full overflow-hidden rounded-xl border shadow-[0_8px_18px_rgb(17_39_60_/0.12)]">
                          <div className="artist-profile-media h-[22rem] w-full overflow-hidden sm:h-[31rem]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={detailItem.gallery[0]}
                              alt={`${detailItem.name} banner`}
                              className="block h-full w-full object-cover opacity-92"
                              loading="lazy"
                            />
                          </div>
                        </article>
                      ) : (
                        detailItem.gallery.slice(0, 4).map((image, index) => (
                          <article
                            key={`${detailItem.id}-gallery-${index}`}
                            className="artist-profile-media-card relative overflow-hidden rounded-xl border shadow-[0_8px_18px_rgb(17_39_60_/0.12)]"
                          >
                            <div className="artist-profile-media h-52 w-full overflow-hidden sm:h-64">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image}
                                alt={`${detailItem.name} gallery ${index + 1}`}
                                className="block h-full w-full object-cover opacity-92"
                                loading="lazy"
                              />
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </article>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
