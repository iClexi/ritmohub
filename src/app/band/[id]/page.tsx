/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBandById } from "@/lib/db";

type BandProfilePageProps = {
  params: Promise<{ id: string }>;
};

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function memberInitials(name: string): string {
  const clean = name.trim();
  if (!clean) {
    return "MU";
  }
  return (
    clean
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((token) => token.charAt(0).toUpperCase())
      .join("") || "MU"
  );
}

export default async function BandProfilePage({ params }: BandProfilePageProps) {
  const { id } = await params;
  const band = await getBandById(id);

  if (!band) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <article className="overflow-hidden rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)]">
          <div className="relative h-60 bg-black sm:h-72">
            {hasValue(band.bannerUrl) ? (
              <img
                src={band.bannerUrl}
                alt={`Banner de ${band.name}`}
                className={`h-full w-full ${band.bannerFit === "contain" ? "object-contain" : "object-cover"}`}
              />
            ) : null}
            {!hasValue(band.bannerUrl) ? (
              <div className="h-full w-full bg-gradient-to-r from-[color:rgb(var(--ui-glow-primary)/0.42)] to-[color:rgb(var(--ui-glow-accent)/0.35)]" />
            ) : null}
          </div>

          <div className="px-6 pb-8 sm:px-8">
            <div className="relative z-10 -mt-10 inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-[var(--ui-surface)] bg-[var(--ui-primary)] text-lg font-bold text-[var(--ui-on-primary)] shadow-lg">
              {hasValue(band.logoUrl) ? (
                <img src={band.logoUrl} alt={`Logo de ${band.name}`} className="h-full w-full object-cover" />
              ) : (
                memberInitials(band.name)
              )}
            </div>

            <p className="mt-4 text-xs font-semibold tracking-[0.22em] text-[var(--ui-muted)]">BANDA</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--ui-text)]">{band.name}</h1>
            <p className="mt-2 text-sm text-[var(--ui-muted)]">{band.members.length} integrantes</p>

            {hasValue(band.genre) ? (
              <p className="mt-2 text-sm text-[var(--ui-text)]">Genero: {band.genre}</p>
            ) : null}

            {hasValue(band.bio) ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--ui-text)]">{band.bio}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/artist/${encodeURIComponent(band.creatorUserId)}`}
                className="rounded-2xl bg-[var(--ui-primary)] px-5 py-3 text-sm font-semibold text-[var(--ui-on-primary)]"
              >
                Ver perfil del creador
              </Link>
              <Link
                href="/dashboard?s=band"
                className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--ui-text)]"
              >
                Volver al workspace
              </Link>
            </div>
          </div>
        </article>

        <section className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--ui-text)]">Integrantes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {band.members.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[color:var(--ui-border)] bg-[var(--ui-surface)] text-xs font-semibold text-[var(--ui-text)]">
                    {hasValue(member.memberAvatar) ? (
                      <img
                        src={member.memberAvatar}
                        alt={`Avatar de ${member.memberName || "integrante"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      memberInitials(member.memberName || "Integrante")
                    )}
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-[var(--ui-text)]">
                      {hasValue(member.memberName) ? member.memberName : "Integrante"}
                    </p>
                    <p className="text-xs text-[var(--ui-muted)]">
                      {hasValue(member.memberMusicianType) ? member.memberMusicianType : "Musico"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[color:var(--ui-border)] px-2 py-1 text-[11px] font-semibold text-[var(--ui-muted)]">
                    {member.role === "admin" ? "Admin" : "Miembro"}
                  </span>
                  <span className="text-xs text-[var(--ui-muted)]">
                    {hasValue(member.memberInstrument) ? member.memberInstrument : "Sin instrumento"}
                  </span>
                </div>

                <Link
                  href={`/artist/${encodeURIComponent(member.userId)}`}
                  className="mt-3 inline-flex text-xs font-semibold text-[var(--ui-primary)]"
                >
                  Ver perfil
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
