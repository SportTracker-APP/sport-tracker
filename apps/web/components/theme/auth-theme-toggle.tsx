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
  const [theme, setTheme] = useState<AppTheme>("violet");

  useEffect(() => {
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme === "nature" ? "nature" : "violet";

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
      className="app-auth-theme-toggle inline-flex h-7 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 text-[10px] font-medium whitespace-nowrap text-zinc-300 backdrop-blur-xl transition hover:border-white/15 hover:bg-white/[0.09] hover:text-white sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
      aria-pressed={isNatureTheme}
      aria-label={label}
    >
      {isNatureTheme ? (
        <Leaf className="h-3 w-3 sm:h-4 sm:w-4" />
      ) : (
        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
      )}
      <span>{label}</span>
    </button>
  );
}
