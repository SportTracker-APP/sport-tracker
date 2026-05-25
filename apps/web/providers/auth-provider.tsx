"use client";

import {
  PropsWithChildren,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { getMe } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

const publicRoutes = [
  "/login",
  "/register",
];

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const router = useRouter();

  const pathname = usePathname();

  const hydrateAuth = useAuthStore(
    (state) => state.hydrateAuth,
  );

  const logout = useAuthStore(
    (state) => state.logout,
  );

  const user = useAuthStore(
    (state) => state.user,
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

        const isPublicRoute =
          publicRoutes.includes(
            pathname,
          );

        // PAS CONNECTÉ
        if (!accessToken) {
          if (!isPublicRoute) {
            router.replace("/login");
          }

          setIsLoading(false);

          return;
        }

        // VALIDATION USER
        const currentUser =
          await getMe();

        hydrateAuth(
          accessToken,
          currentUser,
        );

        // DÉJÀ CONNECTÉ
        if (isPublicRoute) {
          router.replace("/");
        }
      } catch (error) {
        console.error(
          "Auth hydration failed:",
          error,
        );

        logout();

        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [
    hydrateAuth,
    logout,
    pathname,
    router,
  ]);

  // LOADING SCREEN
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />

          <p className="text-sm text-zinc-500">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return children;
}