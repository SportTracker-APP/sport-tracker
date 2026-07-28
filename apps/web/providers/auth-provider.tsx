"use client";

import { PropsWithChildren, useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { BrandMark } from "@/features/auth/login/components/login-hero";
import { AdminImpersonationFrame } from "@/components/admin/admin-impersonation-banner";
import {
  AUTH_IDENTITY_CHANGED_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
} from "@/lib/api";
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
  const shouldBypassAuthGate =
    isPublicRoute && !authEntryRoutes.includes(pathname);

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  const logout = useAuthStore((state) => state.logout);
  const setAuth = useAuthStore((state) => state.setAuth);

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
    const handleIdentityChanged = (event: Event) => {
      const identityEvent = event as CustomEvent<{
        accessToken: string;
        user: {
          id: string;
          firstName: string;
          email: string;
          role?: "USER" | "ADMIN";
          avatarUrl?: string | null;
        };
      }>;

      setAuth(identityEvent.detail.accessToken, identityEvent.detail.user);
      router.replace("/admin");
    };

    window.addEventListener(AUTH_IDENTITY_CHANGED_EVENT, handleIdentityChanged);

    return () => {
      window.removeEventListener(
        AUTH_IDENTITY_CHANGED_EVENT,
        handleIdentityChanged,
      );
    };
  }, [router, setAuth]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (shouldBypassAuthGate) {
          setIsLoading(false);

          return;
        }

        const accessToken =
          sessionStorage.getItem("hovren:admin-impersonation-token") ??
          localStorage.getItem("accessToken");

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
          sessionStorage.getItem("hovren:admin-impersonation-token") ??
            localStorage.getItem("accessToken") ??
            accessToken,
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
        <div
          className="app-auth-loading-sheet"
          role="status"
          aria-live="polite"
        >
          <div className="app-auth-loading-brand">
            <BrandMark showJointDot={false} />
            <p>
              HOVREN<span>.fr</span>
            </p>
          </div>
          <div className="app-auth-loading-trail" aria-hidden="true">
            <span />
          </div>
          <p className="app-auth-loading-copy">Ouverture de ton carnet...</p>
        </div>
      </div>
    );
  }

  return <AdminImpersonationFrame>{children}</AdminImpersonationFrame>;
}
