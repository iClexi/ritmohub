import Link from "next/link";

import { ArtistScrollStage } from "@/components/home/artist-scroll-stage";
import { LandingImage } from "@/components/home/landing-image";
import { ScrollTopReset } from "@/components/ui/scroll-top-reset";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { CurrentUser } from "@/lib/auth/current-user";

type LandingShowcaseProps = {
  user: CurrentUser | null;
};

type BenefitIconKind = "panel" | "concerts" | "collab" | "visibility" | "community" | "workflow";

const heroGallery = [
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1464375117522-1311dd7d0f8b?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1400&q=80",
];

const collabPosts = [
  {
    id: "c-1",
    title: "Busco guitarrista para show indie en vivo",
    author: "@mariavox",
    tags: "Indie, Pop, Show en vivo",
    city: "Santo Domingo",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "c-2",
    title: "Necesito productor para cerrar un EP urbano",
    author: "@ritmoraw",
    tags: "Urbano, Produccion, Mezcla",
    city: "Santiago",
    image:
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "c-3",
    title: "Tecladista para banda de funk y neo soul",
    author: "@leo.sessions",
    tags: "Funk, Neo soul, Sesionista",
    city: "Punta Cana",
    image:
      "https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "c-4",
    title: "Artista visual para gira de verano",
    author: "@aurora.live",
    tags: "Visuales, Live set, Gira",
    city: "La Vega",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80",
  },
];

const cityCards = [
  {
    city: "Santo Domingo",
    image: "/cities/ciudad-1.jpg",
    tags: ["Vocalistas", "Productores", "Bandas", "Visuales"],
  },
  {
    city: "Santiago",
    image: "/cities/ciudad-2.jpg",
    tags: ["Beatmakers", "Guitarristas", "Bajistas", "Compositores"],
  },
  {
    city: "Punta Cana",
    image: "/cities/ciudad-3.jpg",
    tags: ["DJs", "Percusion", "Eventos", "Session players"],
  },
];

type PlatformBenefit = {
  title: string;
  description: string;
  icon: BenefitIconKind;
};

const platformBenefits: PlatformBenefit[] = [
  {
    title: "Panel unificado",
    description: "Gestiona banda, conciertos, comunidades, chats y trabajos desde un mismo lugar.",
    icon: "panel",
  },
  {
    title: "Conciertos mas rapidos",
    description: "Publica flyers, organiza fechas y coordina equipo sin salir de la plataforma.",
    icon: "concerts",
  },
  {
    title: "Colaboraciones activas",
    description: "Encuentra vocalistas, productores y musicos por estilo, ciudad y disponibilidad.",
    icon: "collab",
  },
  {
    title: "Visibilidad para tu proyecto",
    description: "Muestra tu perfil artistico con media, historial y presencia profesional.",
    icon: "visibility",
  },
  {
    title: "Comunidad y networking",
    description: "Participa en foros, abre conversaciones privadas y crea conexiones reales.",
    icon: "community",
  },
  {
    title: "Flujo de trabajo claro",
    description: "De la idea al show: planifica, ejecuta y da seguimiento en una sola ruta.",
    icon: "workflow",
  },
] as const;

export function LandingShowcase({ user }: LandingShowcaseProps) {
  const isLoggedIn = Boolean(user);

  return (
    <main className="landing-shell relative min-h-screen overflow-x-hidden bg-[var(--ui-bg)]">
      <ScrollTopReset />
      <header className="landing-nav fixed inset-x-0 top-4 z-50">
        <div className="landing-container flex items-center justify-between gap-3 rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/92 px-4 py-3 backdrop-blur-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--ui-text)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ui-primary)] text-sm font-bold text-[var(--ui-on-primary)]">
              RH
            </span>
            RitmoHub
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--ui-muted)] md:flex">
            <a href="#colabs" className="landing-link">
              Colabs
            </a>
            <a href="#historias" className="landing-link">
              Historias
            </a>
            <a href="#ciudades" className="landing-link">
              Ciudades
            </a>
            <a href="#final-cta" className="landing-link">
              Unirme
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rh-btn-primary rounded-2xl bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-[var(--ui-on-primary)]"
              >
                Ir al panel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="landing-ghost-btn rounded-2xl border border-[color:var(--ui-border)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)]"
                >
                  Iniciar sesion
                </Link>
                <Link
                  href="/register"
                  className="rh-btn-primary rounded-2xl bg-[var(--ui-accent)] px-4 py-2 text-sm font-semibold text-[#07231e]"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="landing-container landing-hero mx-auto flex w-full min-h-[calc(100vh-7.5rem)] flex-col items-center justify-center pt-30 pb-12 sm:pt-34">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--ui-muted)]">
            <div className="flex -space-x-2">
              <LandingImage
                src="https://randomuser.me/api/portraits/women/23.jpg"
                alt="Miembro"
                className="h-7 w-7 rounded-full border border-white object-cover"
              />
              <LandingImage
                src="https://randomuser.me/api/portraits/men/11.jpg"
                alt="Miembro"
                className="h-7 w-7 rounded-full border border-white object-cover"
              />
              <LandingImage
                src="https://randomuser.me/api/portraits/women/58.jpg"
                alt="Miembro"
                className="h-7 w-7 rounded-full border border-white object-cover"
              />
            </div>
            Musicos colaborando ahora mismo
          </div>

          <h1 className="landing-title mt-6 text-center text-balance text-5xl leading-[1.06] font-semibold tracking-tight text-[var(--ui-text)] sm:text-6xl md:text-7xl">
            La red musical donde tus conexiones se convierten en conciertos.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xl text-[var(--ui-muted)]">
            Publica tu proyecto, encuentra talentos, organiza shows con flyers y mueve tu carrera desde una sola plataforma.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="rh-btn-primary rounded-2xl bg-[var(--ui-primary)] px-6 py-3 text-base font-semibold text-[var(--ui-on-primary)]"
            >
              {isLoggedIn ? "Entrar al panel completo" : "Crear cuenta gratis"}
            </Link>
            <Link
              href="/login"
              className="landing-ghost-btn rounded-2xl border border-[color:var(--ui-border)] px-6 py-3 text-base font-semibold text-[var(--ui-text)]"
            >
              Ver demo privada
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--ui-muted)]">1M+ creativos - 10M+ conexiones - 190 paises</p>
        </div>
      </section>

      <section className="landing-marquee-wrap w-full py-6">
        <div className="landing-marquee landing-marquee-right">
          <div className="landing-marquee-track">
            {[...heroGallery, ...heroGallery].map((image, index) => (
              <article key={`gallery-top-${image}-${index}`} className="landing-media-tile">
                <LandingImage src={image} alt={`Escena musical superior ${index + 1}`} className="h-full w-full object-cover" />
              </article>
            ))}
          </div>
        </div>

        <div className="landing-marquee landing-marquee-left mt-4">
          <div className="landing-marquee-track">
            {[...heroGallery.slice().reverse(), ...heroGallery.slice().reverse()].map((image, index) => (
              <article key={`gallery-bottom-${image}-${index}`} className="landing-media-tile">
                <LandingImage src={image} alt={`Escena musical inferior ${index + 1}`} className="h-full w-full object-cover" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <ArtistScrollStage />

      <section className="landing-container py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard value="129,319,896" label="Conexiones musicales activadas" />
          <MetricCard value="10,420,725" label="Colaboraciones iniciadas" />
          <MetricCard value="190" label="Ciudades y paises activos" />
        </div>
      </section>

      <section id="historias" className="landing-container py-6">
        <article className="landing-why-shell">
          <div className="landing-why-heading">
            <span className="landing-kicker">Por que RitmoHub</span>
            <h2 className="mt-3 text-4xl leading-tight font-semibold text-[var(--ui-text)]">
              Ventajas reales para crecer tu carrera musical.
            </h2>
            <p className="mt-4 text-base text-[var(--ui-muted)]">
              RitmoHub centraliza tu operacion artistica para que inviertas menos tiempo en coordinar y mas tiempo en crear, ensayar y tocar en vivo.
            </p>
          </div>

          <div className="landing-why-grid mt-7">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {platformBenefits.map((benefit) => (
                <article key={benefit.title} className="landing-why-card">
                  <div className="landing-why-card-icon">
                    <BenefitIcon kind={benefit.icon} />
                  </div>
                  <h3 className="text-base leading-tight font-semibold text-[var(--ui-text)]">{benefit.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ui-muted)]">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="landing-why-footer mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]/72 px-4 py-4">
            <p className="max-w-xl text-sm leading-relaxed text-[var(--ui-muted)]">
              RitmoHub conecta colaboracion, produccion y shows en un solo flujo de trabajo para musicos independientes y bandas.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="rh-btn-primary rounded-2xl bg-[var(--ui-accent)] px-6 py-3 text-base font-semibold text-[#07231e]"
              >
                {isLoggedIn ? "Abrir mi panel completo" : "Activar mi panel ahora"}
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section id="colabs" className="landing-container py-16">
        <div className="text-center">
          <span className="landing-kicker">Colaboraciones</span>
          <h3 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--ui-text)]">
            Oportunidades activas en este momento
          </h3>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {collabPosts.map((post, index) => (
            <article
              key={post.id}
              className="landing-collab-card"
              style={{ animationDelay: `${80 + index * 70}ms` }}
            >
              <div className="landing-collab-media">
                <LandingImage src={post.image} alt={post.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <h4 className="text-xl leading-tight font-semibold text-[var(--ui-text)]">{post.title}</h4>
                <p className="mt-2 text-sm font-semibold text-[var(--ui-muted)]">{post.author}</p>
                <p className="mt-1 text-sm text-[var(--ui-muted)]">{post.tags}</p>
                <p className="mt-2 text-sm text-[var(--ui-muted)]">{post.city}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ciudades" className="landing-container py-10">
        <div className="text-center">
          <span className="landing-kicker">Ciudades activas</span>
          <h3 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--ui-text)]">
            Encuentra musicos cerca de ti
          </h3>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {cityCards.map((card, index) => (
            <article key={card.city} className="landing-city-card" style={{ animationDelay: `${120 + index * 80}ms` }}>
              <div className="landing-city-media">
                <LandingImage src={card.image} alt={`Ciudad ${card.city}`} className="h-full w-full object-cover" />
                <div className="landing-city-overlay" />
                <h4 className="landing-city-title">{card.city}</h4>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {card.tags.map((tag) => (
                  <span key={`${card.city}-${tag}`} className="landing-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="final-cta" className="landing-container py-22 text-center">
        <article className="landing-final-cta">
          <h3 className="text-balance text-4xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-5xl">
            Tu proxima colaboracion empieza hoy.
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--ui-muted)]">
            Crea tu cuenta y entra a la version completa con tu banda, conciertos, comunidades, chats privados y oportunidades.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rh-btn-primary rounded-2xl bg-[var(--ui-primary)] px-6 py-3 text-base font-semibold text-[var(--ui-on-primary)]"
            >
              Crear cuenta y entrar al panel
            </Link>
            <Link
              href="/login"
              className="landing-ghost-btn rounded-2xl border border-[color:var(--ui-border)] px-6 py-3 text-base font-semibold text-[var(--ui-text)]"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

function BenefitIcon({ kind }: { kind: BenefitIconKind }) {
  const baseClass = "h-4 w-4";

  if (kind === "panel") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v17M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "concerts") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" aria-hidden="true">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "collab") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" aria-hidden="true">
        <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19c.5-3 2.5-4.5 4.5-4.5s4 1.5 4.5 4.5M12.5 19c.4-2.1 1.8-3.5 3.5-3.5 1.6 0 3 1.2 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "visibility") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" aria-hidden="true">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "community") {
    return (
      <svg viewBox="0 0 24 24" className={baseClass} fill="none" aria-hidden="true">
        <path d="M3 12c2.5-3 5.2-3 9 0s6.5 3 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3 16c2.5-3 5.2-3 9 0s6.5 3 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <path d="M3 8c2.5-3 5.2-3 9 0s6.5 3 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={baseClass} fill="none" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="14.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 20.5h8M12 18.5v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 10.5h7M8.5 13.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="landing-stat-card">
      <p className="text-4xl font-semibold tracking-tight text-[var(--ui-text)]">{value}</p>
      <p className="mt-2 text-base text-[var(--ui-muted)]">{label}</p>
    </article>
  );
}
