"use client";

import { useCallback, useEffect, useState } from "react";

import { Leaf, Sparkles } from "lucide-react";

const LEGACY_THEME_STORAGE_KEY = "sport-tracker-theme";
const THEME_STORAGE_KEY = "sport-tracker-theme-v2";
const NATURE_THEME_CLASS = "sport-theme-nature";
const THEME_CHANGE_EVENT = "hovren-theme-change";

export type AppTheme = "violet" | "nature";

function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "nature";
  }

  return localStorage.getItem(THEME_STORAGE_KEY) === "violet"
    ? "violet"
    : "nature";
}

function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle(
    NATURE_THEME_CLASS,
    theme === "nature",
  );

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(
    new CustomEvent<AppTheme>(THEME_CHANGE_EVENT, {
      detail: theme,
    }),
  );
}

export function useAppTheme() {
  const [theme, setThemeState] = useState<AppTheme>("nature");

  useEffect(() => {
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);

    const initialTheme = getStoredTheme();

    setThemeState(initialTheme);
    applyTheme(initialTheme);

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<AppTheme>;

      setThemeState(customEvent.detail);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  return {
    theme,
    setTheme,
    isNatureTheme: theme === "nature",
  };
}

export function ThemeSwitcher() {
  const { isNatureTheme, setTheme } = useAppTheme();

  const title = isNatureTheme
    ? "Activer le thème violet"
    : "Activer le thème vert";
  const subtitle = isNatureTheme
    ? "Retour au style original"
    : "Version claire & nature";

  return (
    <button
      type="button"
      onClick={() => setTheme(isNatureTheme ? "violet" : "nature")}
      className={`theme-switcher group relative mt-5 w-full overflow-hidden rounded-[24px] border p-4 text-left transition-all duration-300 ${
        isNatureTheme
          ? "border-emerald-400/24 bg-emerald-500/[0.10] text-emerald-50"
          : "border-white/[0.08] bg-white/[0.035] text-zinc-300 hover:border-emerald-400/22 hover:bg-emerald-500/[0.075]"
      }`}
      aria-pressed={isNatureTheme}
      aria-label={title}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.16),transparent_44%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors ${
            isNatureTheme
              ? "border-emerald-300/25 bg-emerald-400/20 text-emerald-100"
              : "border-white/[0.08] bg-black/20 text-emerald-300"
          }`}
        >
          {isNatureTheme ? (
            <Leaf className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p
            className={`mt-0.5 text-xs ${
              isNatureTheme ? "text-emerald-50/65" : "text-zinc-500"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}
