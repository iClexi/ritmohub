export default function AdminUsersLoading() {
  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-4 pb-8 pt-24 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-6">
          <div className="flex items-center gap-3 text-[var(--ui-text)]">
            <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-[var(--ui-primary)]" />
            <span className="text-sm font-semibold">Cargando panel de administración...</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)]"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
