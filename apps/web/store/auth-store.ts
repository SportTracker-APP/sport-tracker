import { create } from "zustand";

interface User {
  id: string;

  firstName: string;

  email: string;

  role?: "USER" | "ADMIN";

  avatarUrl?: string | null;
}

interface AuthState {
  accessToken: string | null;

  user: User | null;

  setAuth: (accessToken: string, user: User) => void;

  hydrateAuth: (accessToken: string, user: User) => void;

  setUser: (user: User | null) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,

  user: null,

  setAuth: (accessToken, user) => {
    localStorage.setItem("accessToken", accessToken);

    set({
      accessToken,
      user,
    });
  },

  hydrateAuth: (accessToken, user) => {
    set({
      accessToken,
      user,
    });
  },

  setUser: (user) => {
    set({
      user,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");

    set({
      accessToken: null,
      user: null,
    });
  },
}));
