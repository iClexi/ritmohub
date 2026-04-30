/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getBandByUserId,
  getUserById,
  listRecentConcertsByUser,
  listRecentForumCommentsByUser,
  listRecentForumPostsByUser,
} from "@/lib/db";

type ArtistProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posts?: string; comments?: string; members?: string }>;
};

const PROFILE_LIMIT_OPTIONS = [5, 10, 20] as const;
type ProfileLimit = (typeof PROFILE_LIMIT_OPTIONS)[number];

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function displayValue(value: string | null | undefined, fallback = ""): string {
  if (!hasValue(value)) {
    return fallback;
  }
  return value;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function trimText(value: string, max = 180): string {
  const clean = value.trim();
  if (clean.length <= max) {
    return clean;
  }
  return `${clean.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function concertStatusLabel(status: string): string {
  if (status === "lead") return "Lead";
  if (status === "negotiation") return "Negociacion";
  if (status === "confirmed") return "Confirmado";
  if (status === "post_show") return "Post show";
  return status;
}

function parseProfileLimit(value: string | undefined, fallback: ProfileLimit): ProfileLimit {
  const parsed = Number(value);
  if (PROFILE_LIMIT_OPTIONS.includes(parsed as ProfileLimit)) {
    return parsed as ProfileLimit;
  }
  return fallback;
}


export default async function ArtistProfilePage({ params, searchParams }: ArtistProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const postsLimit = parseProfileLimit(query.posts, 5);
  const commentsLimit = parseProfileLimit(query.comments, 5);
  const membersLimit = parseProfileLimit(query.members, 5);
  const selectedLimits: {
    posts: ProfileLimit;
    comments: ProfileLimit;
    members: ProfileLimit;
  } = {
    posts: postsLimit,
    comments: commentsLimit,
    members: membersLimit,
  };
  const buildProfileHref = (changes: Partial<typeof selectedLimits>) => {
    const next = { ...selectedLimits, ...changes };
    const qs = new URLSearchParams({
      posts: String(next.posts),
      comments: String(next.comments),
      members: String(next.members),
    });
    return `/artist/${encodeURIComponent(id)}?${qs.toString()}`;
  };

  const [user, recentPosts, recentComments, recentConcerts, band] = await Promise.all([
    getUserById(id),
    listRecentForumPostsByUser(id, postsLimit),
    listRecentForumCommentsByUser(id, commentsLimit),
    listRecentConcertsByUser(id, 8),
    getBandByUserId(id),
  ]);

  if (!user) {
    notFound();
  }

  const initials = user.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((t) => t.charAt(0).toUpperCase())
    .join("") || "MU";

  const instagramHandle = user.socialInstagram.trim().replace(/^@+/, "");
  const instagramUrl = instagramHandle
    ? `https://instagram.com/${encodeURIComponent(instagramHandle)}`
    : "";

  const basicInfo = [
    { label: "Nombre artistico / Stage name", value: user.stageName },
    { label: "Tipo de musico", value: user.musicianType },
    { label: "Instrumento principal", value: user.primaryInstrument },
    { label: "Estoy buscando", value: user.orientation },
    { label: "Formacion musical", value: user.studies },
    { label: "Genero musical", value: user.genre },
    { label: "Ubicacion", value: user.location },
  ];

  const socialIcons = [
    {
      label: "Instagram",
      href: instagramUrl,
      color: "#E1306C",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      ),
    },
    {
      label: "Spotify",
      href: hasValue(user.socialSpotify) ? user.socialSpotify : "",
      color: "#1DB954",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: hasValue(user.socialYoutube) ? user.socialYoutube : "",
      color: "#FF0000",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
  ].filter((s) => s.href);

  const profileSummary = [
    { label: "Instrumento", value: user.primaryInstrument },
    { label: "Tipo", value: user.musicianType },
    { label: "Ubicacion", value: user.location },
  ];

  const summaryStats = [
    { label: "Posts recientes", value: recentPosts.length },
    { label: "Comentarios recientes", value: recentComments.length },
    { label: "Conciertos recientes", value: recentConcerts.length },
    { label: "Integrantes de banda", value: band?.members.length ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
          <div className="relative h-44 bg-gradient-to-r from-[color:rgb(var(--ui-glow-primary)/0.42)] to-[color:rgb(var(--ui-glow-accent)/0.35)] sm:h-56">
            {hasValue(user.coverUrl) ? (
              <img src={user.coverUrl} alt={`Portada de ${user.name}`} className="h-full w-full object-cover" />
            ) : null}
          </div>

          <div className="px-6 pb-8 sm:px-8">
            <div className="relative z-10 -mt-11 inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--ui-surface)] bg-[var(--ui-primary)] text-2xl font-bold text-[var(--ui-on-primary)] shadow-lg">
              {hasValue(user.avatarUrl) ? (
                <img src={user.avatarUrl} alt={`Avatar de ${user.name}`} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <p className="mt-4 text-xs font-semibold tracking-[0.22em] text-[var(--ui-muted)]">PERFIL PUBLICO</p>

            <h1 className="mt-2 text-3xl font-semibold text-[var(--ui-text)]">{user.name}</h1>
            {hasValue(user.tagline) ? (
              <p className="mt-2 text-sm italic text-[var(--ui-text)]">&ldquo;{user.tagline}&rdquo;</p>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <section className="space-y-4 lg:col-span-2">
                <div className="rounded-2xl bg-[var(--ui-surface-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Bio</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ui-text)]">{displayValue(user.bio)}</p>
                </div>

                <div className="rounded-2xl bg-[var(--ui-surface-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Informacion basica</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {basicInfo.map((item) => (
                      <article key={item.label} className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-3">
                        <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">{displayValue(item.value)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                {socialIcons.length > 0 && (
                  <div className="w-fit rounded-2xl bg-[var(--ui-surface-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Redes sociales</p>
                    <div className="mt-3 flex items-start gap-3">
                      {socialIcons.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={item.label}
                          style={{ color: item.color }}
                          className="flex flex-col items-center gap-1.5 transition hover:scale-110"
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] shadow-sm hover:shadow-lg">
                            {item.icon}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--ui-muted)]">{item.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-[var(--ui-surface-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Resumen de perfil</p>
                  <div className="mt-3 grid gap-2">
                    {profileSummary.map((item) => (
                      <article key={item.label} className="rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">{displayValue(item.value)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard?s=communities"
                className="inline-flex rounded-2xl bg-[var(--ui-primary)] px-5 py-3 text-sm font-semibold text-[var(--ui-on-primary)]"
              >
                Volver a comunidades
              </Link>

              <Link
                href="/dashboard?s=communities"
                className="inline-flex rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--ui-text)]"
              >
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3"
            >
              <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ui-text)]">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--ui-text)]">Conciertos recientes</h2>
            <Link
              href="/dashboard?s=shows"
              className="rounded-xl border border-[color:var(--ui-border)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]"
            >
              Ver cartelera
            </Link>
          </div>
          {recentConcerts.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ui-muted)]">Este usuario aun no ha publicado conciertos.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recentConcerts.map((concert) => (
                <article
                  key={concert.id}
                  className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4"
                >
                  <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">
                    {concertStatusLabel(concert.status)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--ui-text)]">{concert.title}</h3>
                  <p className="mt-1 text-sm text-[var(--ui-muted)]">{concert.venue} - {concert.city}</p>
                  <p className="mt-2 text-xs text-[var(--ui-muted)]">{formatDateTime(concert.date)}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[var(--ui-text)]">Posts recientes</h2>
              <Link
                href="/dashboard?s=communities"
                className="rounded-xl border border-[color:var(--ui-border)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)]"
              >
                Ir a comunidades
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Mostrar</span>
              {PROFILE_LIMIT_OPTIONS.map((limit) => (
                <Link
                  key={`posts-limit-${limit}`}
                  href={buildProfileHref({ posts: limit })}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${postsLimit === limit
                    ? "border-[color:rgb(var(--ui-glow-primary)/0.5)] bg-[color:rgb(var(--ui-glow-primary)/0.14)] text-[var(--ui-text)]"
                    : "border-[color:var(--ui-border)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)]"
                    }`}
                >
                  {limit}
                </Link>
              ))}
            </div>
            {recentPosts.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--ui-muted)]">Este usuario aun no tiene posts recientes.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">{post.category}</p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--ui-text)]">{post.title}</h3>
                    <p className="mt-2 text-sm text-[var(--ui-muted)]">{trimText(post.body, 180)}</p>
                    <p className="mt-2 text-xs text-[var(--ui-muted)]">
                      {post.comments.length} comentarios - {formatDateTime(post.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6">
            <h2 className="text-xl font-semibold text-[var(--ui-text)]">Comentarios recientes</h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Mostrar</span>
              {PROFILE_LIMIT_OPTIONS.map((limit) => (
                <Link
                  key={`comments-limit-${limit}`}
                  href={buildProfileHref({ comments: limit })}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${commentsLimit === limit
                    ? "border-[color:rgb(var(--ui-glow-primary)/0.5)] bg-[color:rgb(var(--ui-glow-primary)/0.14)] text-[var(--ui-text)]"
                    : "border-[color:var(--ui-border)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)]"
                    }`}
                >
                  {limit}
                </Link>
              ))}
            </div>
            {recentComments.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--ui-muted)]">Este usuario aun no tiene comentarios recientes.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentComments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">
                      En: {comment.postTitle}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ui-text)]">{trimText(comment.text, 160)}</p>
                    <p className="mt-2 text-xs text-[var(--ui-muted)]">{formatDateTime(comment.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--ui-text)]">Banda</h2>
            {band ? (
              <Link
                href={`/band/${encodeURIComponent(band.id)}`}
                className="rounded-xl bg-[var(--ui-primary)] px-3 py-1 text-xs font-semibold text-[var(--ui-on-primary)]"
              >
                Ver todos los integrantes
              </Link>
            ) : null}
          </div>
          {band ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Integrantes visibles</span>
              {PROFILE_LIMIT_OPTIONS.map((limit) => (
                <Link
                  key={`members-limit-${limit}`}
                  href={buildProfileHref({ members: limit })}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${membersLimit === limit
                    ? "border-[color:rgb(var(--ui-glow-primary)/0.5)] bg-[color:rgb(var(--ui-glow-primary)/0.14)] text-[var(--ui-text)]"
                    : "border-[color:var(--ui-border)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-soft)]"
                    }`}
                >
                  {limit}
                </Link>
              ))}
            </div>
          ) : null}

          {!band ? (
            <p className="mt-4 text-sm text-[var(--ui-muted)]">Este usuario no pertenece a una banda actualmente.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-wide text-[var(--ui-muted)]">Nombre de banda</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--ui-text)]">{band.name}</h3>
                {hasValue(band.genre) ? <p className="mt-1 text-sm text-[var(--ui-muted)]">Genero: {band.genre}</p> : null}
                {hasValue(band.bio) ? <p className="mt-2 text-sm text-[var(--ui-text)]">{trimText(band.bio, 220)}</p> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {band.members.slice(0, membersLimit).map((member) => (
                  <article
                    key={member.id}
                    className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--ui-text)]">
                      {hasValue(member.memberName) ? member.memberName : "Integrante"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ui-muted)]">
                      {displayValue(member.memberInstrument, "Sin instrumento")}
                    </p>
                    <Link
                      href={`/artist/${encodeURIComponent(member.userId)}`}
                      className="mt-2 inline-flex text-xs font-semibold text-[var(--ui-primary)]"
                    >
                      Ver perfil
                    </Link>
                  </article>
                ))}
              </div>
              {band.members.length > membersLimit ? (
                <p className="text-xs text-[var(--ui-muted)]">
                  Mostrando {membersLimit} de {band.members.length} integrantes.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
