import { create } from "zustand";

import type { AuthUser } from "@/lib/auth";

const IMPERSONATION_STORAGE_KEY = "hovren:admin-impersonation";
const IMPERSONATION_TOKEN_KEY = "hovren:admin-impersonation-token";

function syncImpersonationMarker(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (user?.impersonation) {
    window.sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, "true");
    return;
  }

  window.sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
}

interface AuthState {
  accessToken: string | null;

  user: AuthUser | null;

  setAuth: (accessToken: string, user: AuthUser) => void;

  hydrateAuth: (accessToken: string, user: AuthUser) => void;

  setUser: (user: AuthUser | null) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,

  user: null,

  setAuth: (accessToken, user) => {
    if (user.impersonation) {
      sessionStorage.setItem(IMPERSONATION_TOKEN_KEY, accessToken);
    } else {
      localStorage.setItem("accessToken", accessToken);
      sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
    }
    syncImpersonationMarker(user);

    set({
      accessToken,
      user,
    });
  },

  hydrateAuth: (accessToken, user) => {
    syncImpersonationMarker(user);

    set({
      accessToken,
      user,
    });
  },

  setUser: (user) => {
    syncImpersonationMarker(user);

    set({
      user,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);

    set({
      accessToken: null,
      user: null,
    });
  },
}));
