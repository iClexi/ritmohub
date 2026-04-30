type Props = {
  title: string;
  subtitle: string;
};

export function AcademiaxRouteLoading({ title, subtitle }: Props) {
  return (
    <main className="min-h-screen pt-24" style={{ background: "var(--ui-bg)", color: "var(--ui-text)" }}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div
          className="rounded-3xl border p-8"
          style={{
            background: "var(--ui-surface)",
            borderColor: "var(--ui-border)",
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: "#818cf8" }}>
            {title}
          </p>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--ui-text)" }}>
            {subtitle}
          </h1>
          <div className="mt-5 h-2.5 w-56 animate-pulse rounded-full" style={{ background: "var(--ui-surface-soft)" }} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border p-5"
              style={{
                background: "var(--ui-surface)",
                borderColor: "var(--ui-border)",
              }}
            >
              <div className="h-28 rounded-2xl" style={{ background: "var(--ui-surface-soft)" }} />
              <div className="mt-4 h-4 w-8/12 rounded-xl" style={{ background: "var(--ui-surface-soft)" }} />
              <div className="mt-3 h-3 w-5/12 rounded-xl" style={{ background: "var(--ui-surface-soft)" }} />
              <div className="mt-5 h-9 w-full rounded-2xl" style={{ background: "var(--ui-surface-soft)" }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}