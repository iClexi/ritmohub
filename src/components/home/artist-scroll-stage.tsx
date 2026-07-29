"use client";

import Image from "next/image";
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
    id: "luma-07",
    name: "LUMA-07",
    category: "Concepto ficticio · Alt-pop",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Personaje ficticio de alt-pop digital que convierte sintetizadores luminosos, melodías íntimas y visuales de ciencia ficción en una experiencia de escenario envolvente.",
    thumbnail: "/artists/concepts/luma-07.webp",
    accent: "#3B82F6",
    secondary: "#06B6D4",
  },
  {
    id: "nodo-lila",
    name: "NODO LILA",
    category: "Concepto ficticio · Electrónica",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Productora ficticia de electrónica nocturna: capas modulares, percusión precisa y paisajes violetas diseñados para escuchar con audífonos o bailar frente a un sistema enorme.",
    thumbnail: "/artists/concepts/nodo-lila.webp",
    accent: "#A855F7",
    secondary: "#EC4899",
  },
  {
    id: "marea-cero",
    name: "MAREA CERO",
    category: "Concepto ficticio · Dúo electrónico",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Dúo ficticio que mezcla pulsos electrónicos, texturas marinas y voces en contraste para construir canciones que avanzan como una marea bajo luces de neón.",
    thumbnail: "/artists/concepts/marea-cero.webp",
    accent: "#14B8A6",
    secondary: "#FB7185",
  },
  {
    id: "bruma-9",
    name: "BRUMA 9",
    category: "Concepto ficticio · Rock alternativo",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Guitarrista ficticio de rock alternativo con riffs densos, silencios dramáticos y un directo de energía cruda envuelto en rojos profundos.",
    thumbnail: "/artists/concepts/bruma-9.webp",
    accent: "#DC2626",
    secondary: "#F97316",
  },
  {
    id: "isla-ruido",
    name: "ISLA RUIDO",
    category: "Concepto ficticio · Indie tropical",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Trío ficticio de indie tropical que cruza guitarras ligeras, percusión cálida y coros de verano con una actitud espontánea de ensayo entre amistades.",
    thumbnail: "/artists/concepts/isla-ruido.webp",
    accent: "#F59E0B",
    secondary: "#0D9488",
  },
  {
    id: "vela-indigo",
    name: "VELA ÍNDIGO",
    category: "Concepto ficticio · Neo-soul",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Vocalista ficticia de neo-soul con arreglos de terciopelo, armonías cálidas y una presencia serena que convierte cada interpretación en una conversación cercana.",
    thumbnail: "/artists/concepts/vela-indigo.webp",
    accent: "#4338CA",
    secondary: "#D97706",
  },
  {
    id: "pulso-nacar",
    name: "PULSO NÁCAR",
    category: "Concepto ficticio · Percusión electrónica",
    subtitle: "Universo creativo RitmoHub",
    description:
      "Artista ficticia de percusión electrónica que combina patrones orgánicos, resonancias de nácar y pequeños destellos digitales en un ritual rítmico contemporáneo.",
    thumbnail: "/artists/concepts/pulso-nacar.webp",
    accent: "#C2410C",
    secondary: "#84CC16",
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
  const detailImage = detailItem?.thumbnail ?? DEFAULT_ARTIST_IMAGE;

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
              <p className="text-xs font-semibold tracking-[0.2em] text-white/80">CONCEPTOS ORIGINALES</p>
              <h2 className="mt-2 font-serif text-[clamp(2.1rem,11vw,8rem)] leading-[0.92] tracking-[0.08em] sm:tracking-[0.14em] text-white">
                MUSISEC STAGE
              </h2>
              <p className="mt-6 max-w-[510px] text-[clamp(1rem,0.35vw+0.9rem,1.28rem)] leading-relaxed text-white/90">
                Descubre artistas ficticios creados exclusivamente para RitmoHub: desliza para recorrer identidades, estilos y universos musicales.
              </p>
              <p className="mt-2 max-w-[510px] text-[clamp(0.94rem,0.25vw+0.86rem,1.1rem)] leading-relaxed text-white/76">
                Todos los nombres, relatos e imágenes de esta sección son conceptos creativos y no representan a personas reales.
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white transition hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-45"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white transition hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-45"
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
                  >
                    <div className="showcase-card-media relative">
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 78vw, 440px"
                        className="object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                      />
                    </div>
                    <p className="showcase-card-label">
                      {item.name}
                      <span className="ml-1 inline-block" aria-hidden="true">-&gt;</span>
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
                    <Image
                      src={detailImage}
                      alt={detailItem.name}
                      width={1120}
                      height={1800}
                      sizes="(max-width: 1024px) 100vw, 45vw"
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

                    <div className="artist-fiction-card mt-4 flex min-h-[13rem] flex-1 flex-col justify-between overflow-hidden rounded-2xl border p-5 sm:p-6">
                      <div>
                        <p className="artist-profile-card-kicker text-xs font-semibold tracking-[0.13em]">
                          CONCEPTO FICTICIO
                        </p>
                        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--ui-text)] sm:text-lg">
                          El nombre, la historia y la ilustración de este perfil fueron creados para la experiencia visual de RitmoHub. No representan ni imitan a una persona o agrupación real.
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="artist-fiction-chip rounded-full border px-3 py-1.5">Identidad inventada</span>
                        <span className="artist-fiction-chip rounded-full border px-3 py-1.5">Ilustración original</span>
                        <span className="artist-fiction-chip rounded-full border px-3 py-1.5">Demo de producto</span>
                      </div>
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
