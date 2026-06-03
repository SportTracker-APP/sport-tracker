"use client";

import { PropsWithChildren, useEffect, useState } from "react";

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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />
      </div>
    );
  }

  return children;
}
