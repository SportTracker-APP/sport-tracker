"use client";

import { PropsWithChildren, useEffect, useState } from "react";

import { Mountain } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

import { getMe } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

const publicRoutes = ["/login", "/register", "/theme-lab"];

const authEntryRoutes = ["/login", "/register"];

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();

  const pathname = usePathname();

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  const logout = useAuthStore((state) => state.logout);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isPublicRoute = publicRoutes.includes(pathname);

        const accessToken = localStorage.getItem("accessToken");

        // PAS CONNECTÉ
        if (!accessToken) {
          if (!isPublicRoute) {
            router.replace("/login");
          }

          setIsLoading(false);

          return;
        }

        // VALIDATION TOKEN
        const currentUser = await getMe();

        hydrateAuth(accessToken, currentUser);

        // SI connecté et page de connexion/inscription
        if (authEntryRoutes.includes(pathname)) {
          router.replace("/");
        }
      } catch (error) {
        console.error("Auth hydration failed:", error);

        logout();

        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="app-auth-loading flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="app-auth-loading-logo relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
            <div className="absolute inset-2 animate-pulse rounded-2xl border border-current opacity-30" />
            <Mountain className="relative h-8 w-8" strokeWidth={2.35} />
          </div>
          <p className="mt-4 text-sm font-semibold">Montaro</p>
          <p className="mt-1 text-xs">Préparation de votre espace...</p>
        </div>
      </div>
    );
  }

  return children;
}
