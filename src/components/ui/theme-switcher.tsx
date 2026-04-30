"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rh-theme";

type ThemeId = "classic" | "noir" | "sunset" | "aurora";

type ThemeOption = {
  id: ThemeId;
  label: string;
};

const themeOptions: ThemeOption[] = [
  { id: "classic", label: "Classic" },
  { id: "noir", label: "Noir" },
  { id: "sunset", label: "Sunset" },
  { id: "aurora", label: "Aurora" },
];

function isThemeId(value: string): value is ThemeId {
  return themeOptions.some((theme) => theme.id === value);
}

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") {
      return "classic";
    }

    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return storedTheme && isThemeId(storedTheme) ? storedTheme : "classic";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = (value: string) => {
    if (!isThemeId(value)) {
      return;
    }

    setTheme(value);
    applyTheme(value);
  };

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[var(--ui-text)] backdrop-panel">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
        {compact ? "Tema" : "Paleta"}
      </span>

      <select
        value={theme}
        onChange={(event) => handleThemeChange(event.target.value)}
        className="h-8 rounded-lg border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-2 text-sm font-semibold text-[var(--ui-text)] outline-none transition focus:border-[var(--ui-primary)]"
      >
        {themeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
