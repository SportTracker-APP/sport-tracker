"use client";

import { useEffect, useState } from "react";

import { Leaf, Sparkles } from "lucide-react";

const LEGACY_THEME_STORAGE_KEY = "sport-tracker-theme";
const THEME_STORAGE_KEY = "sport-tracker-theme-v2";
const NATURE_THEME_CLASS = "sport-theme-nature";

type AppTheme = "violet" | "nature";

function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle(
    NATURE_THEME_CLASS,
    theme === "nature",
  );

  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function AuthThemeToggle() {
  const [theme, setTheme] = useState<AppTheme>("nature");

  useEffect(() => {
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme === "violet" ? "violet" : "nature";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const isNatureTheme = theme === "nature";
  const label = isNatureTheme
    ? "Activer le thème violet"
    : "Activer le thème vert";

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = isNatureTheme ? "violet" : "nature";

        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      className="app-auth-theme-toggle inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-zinc-300 backdrop-blur-xl transition hover:border-white/15 hover:bg-white/[0.09] hover:text-white"
      aria-pressed={isNatureTheme}
      aria-label={label}
    >
      {isNatureTheme ? (
        <Leaf className="h-4 w-4" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
