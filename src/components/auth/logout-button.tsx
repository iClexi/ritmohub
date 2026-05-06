"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Cerrar sesion"
      title="Cerrar sesion"
      className="inline-flex h-10 w-10 sm:w-auto items-center justify-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] sm:px-4 sm:py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)] hover:bg-[var(--ui-surface-soft)] disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="hidden sm:inline">{isLoading ? "Cerrando..." : "Cerrar sesion"}</span>
    </button>
  );
}
