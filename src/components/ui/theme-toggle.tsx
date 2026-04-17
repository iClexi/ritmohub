"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "rh-theme";
type ThemeMode = "classic" | "noir";

function readStoredTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    const domTheme = document.documentElement.getAttribute("data-theme");
    if (domTheme === "noir") {
      return "noir";
    }
  }

  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "noir" ? "noir" : "classic";
  } catch {
    return "classic";
  }
}

function writeStoredTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors (private mode/policy restrictions)
  }

  document.cookie = `rh-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  writeStoredTheme(theme);
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3c.1 0 .2 0 .3.01A7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "classic";
    }

    return readStoredTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentTheme = isHydrated ? theme : "classic";
    const nextTheme: ThemeMode = currentTheme === "classic" ? "noir" : "classic";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const activeTheme: ThemeMode = isHydrated ? theme : "classic";
  const buttonLabel =
    !isHydrated
      ? "Cambiar tema"
      : activeTheme === "classic"
        ? "Activar tema oscuro"
        : "Activar tema claro";
  const buttonTitle =
    !isHydrated ? "Cambiar tema" : activeTheme === "classic" ? "Tema oscuro" : "Tema claro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={buttonLabel}
      title={buttonTitle}
      className="rh-icon-button inline-flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)]"
    >
      {!isHydrated ? <MoonIcon /> : activeTheme === "classic" ? <MoonIcon /> : <SunIcon />}
      <span className="hidden sm:inline">
        {!isHydrated ? "Tema" : activeTheme === "classic" ? "Oscuro" : "Claro"}
      </span>
    </button>
  );
}
