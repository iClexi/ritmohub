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
      className="rh-icon-button inline-flex items-center rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)] hover:bg-[var(--ui-surface-soft)] disabled:opacity-60"
    >
      {isLoading ? "Cerrando..." : "Cerrar sesion"}
    </button>
  );
}
