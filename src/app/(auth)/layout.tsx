import Link from "next/link";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--ui-bg)] lg:flex-row">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[color:rgb(var(--ui-glow-primary)/0.22)] blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[color:rgb(var(--ui-glow-accent)/0.25)] blur-3xl" />
      </div>

      <aside className="relative hidden w-full lg:flex lg:w-1/2 xl:w-3/5">
        <div className="mx-auto flex w-full max-w-2xl flex-col justify-between px-12 py-16">
          <Link href="/" className="text-sm font-semibold tracking-widest text-[var(--ui-text)]/80">
            RITMOHUB
          </Link>

          <div className="animate-fade-up space-y-8">
            <span className="inline-flex rounded-full bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-4 py-2 text-sm font-semibold text-[var(--ui-danger)]">
              Comunidad de artistas
            </span>
            <h1 className="max-w-xl text-5xl leading-tight font-semibold text-[var(--ui-text)]">
              Gestiona tu proyecto musical desde un solo lugar.
            </h1>
            <p className="max-w-lg text-lg text-[var(--ui-muted)]">
              Organiza conciertos, comparte flyers y coordina ensayos con tu equipo de forma simple.
            </p>
          </div>

          <div className="grid max-w-md gap-4 text-sm text-[var(--ui-muted)] sm:grid-cols-2">
            <div className="rh-card rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 backdrop-panel">
              Panel para eventos, ensayos y colaboraciones
            </div>
            <div className="rh-card rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-4 backdrop-panel">
              Base de datos persistente lista para despliegue
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:w-1/2 xl:w-2/5">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="animate-fade-up backdrop-panel rh-card w-full max-w-md rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-xl shadow-[color:rgb(var(--ui-glow-primary)/0.16)]">
          {children}
        </div>
      </main>
    </div>
  );
}
