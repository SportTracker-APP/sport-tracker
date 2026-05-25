"use client";

import {
  PropsWithChildren,
  useEffect,
  useState,
} from "react";

import { getMe } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const hydrateAuth = useAuthStore(
    (state) => state.hydrateAuth,
  );

  const logout = useAuthStore(
    (state) => state.logout,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken =
          localStorage.getItem(
            "accessToken",
          );

        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        const user = await getMe();

        hydrateAuth(accessToken, user);
      } catch (error) {
        console.error(
          "Auth hydration failed:",
          error,
        );

        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [hydrateAuth, logout]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-zinc-400">
          Chargement...
        </p>
      </div>
    );
  }

  return children;
}