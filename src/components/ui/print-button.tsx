"use client";

export function PrintButton({ label = "Imprimir / PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden landing-ghost-btn inline-flex items-center gap-2 rounded-2xl border border-[color:var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] sm:px-4 sm:py-2 sm:text-sm"
      aria-label="Imprimir o guardar como PDF"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
