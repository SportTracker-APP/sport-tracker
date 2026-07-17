"use client";

import { PropsWithChildren, useEffect, useState } from "react";

import { Mountain } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

import { AUTH_SESSION_EXPIRED_EVENT } from "@/lib/api";
import { getMe } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/theme-lab",
  "/confidentialite",
  "/conditions",
];

const authEntryRoutes = ["/login", "/register", "/verify-email"];

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();

  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);
  const shouldBypassAuthGate = isPublicRoute && !authEntryRoutes.includes(pathname);

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  const logout = useAuthStore((state) => state.logout);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleExpiredSession = () => {
      logout();
      router.replace("/login");
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleExpiredSession,
      );
    };
  }, [logout, router]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (shouldBypassAuthGate) {
          setIsLoading(false);

          return;
        }

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

        hydrateAuth(
          localStorage.getItem("accessToken") ?? accessToken,
          currentUser,
        );

        // SI connecté et page de connexion/inscription
        if (authEntryRoutes.includes(pathname)) {
          router.replace("/refuge");
        }
      } catch (error) {
        console.error("Auth hydration failed:", error);

        logout();

        if (!publicRoutes.includes(pathname)) {
          router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, [pathname, shouldBypassAuthGate, hydrateAuth, logout, router]);

  if (isLoading && !shouldBypassAuthGate) {
    return (
      <div className="app-auth-loading flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="app-auth-loading-logo relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
            <div className="absolute inset-2 animate-pulse rounded-2xl border border-current opacity-30" />
            <Mountain className="relative h-8 w-8" strokeWidth={2.35} />
          </div>
          <p className="mt-4 text-sm font-semibold">Hovren</p>
          <p className="mt-1 text-xs">Préparation de ton refuge...</p>
        </div>
      </div>
    );
  }

  return children;
}
