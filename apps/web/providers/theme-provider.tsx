"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const Provider = NextThemesProvider as React.ComponentType<
    React.PropsWithChildren<Record<string, unknown>>
  >;

  return (
    <Provider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </Provider>
  );
}
