import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const AUTH_SESSION_EXPIRED_EVENT = "hovren:auth-session-expired";
export const AUTH_IDENTITY_CHANGED_EVENT = "hovren:auth-identity-changed";
export const ADMIN_IMPERSONATION_STORAGE_KEY = "hovren:admin-impersonation";
export const ADMIN_IMPERSONATION_TOKEN_KEY =
  "hovren:admin-impersonation-token";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const sessionApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RefreshSessionResponse = {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    email: string;
    role?: "USER" | "ADMIN";
    avatarUrl?: string | null;
  };
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  sessionRetry?: boolean;
};

let refreshRequest: Promise<RefreshSessionResponse> | null = null;

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.sessionStorage.getItem(ADMIN_IMPERSONATION_TOKEN_KEY) ??
    window.localStorage.getItem("accessToken")
  );
}

function expireLocalSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("accessToken");
  window.sessionStorage.removeItem(ADMIN_IMPERSONATION_TOKEN_KEY);
  window.sessionStorage.removeItem(ADMIN_IMPERSONATION_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = sessionApi
      .post<RefreshSessionResponse>("/auth/refresh")
      .then(({ data }) => {
        window.sessionStorage.removeItem(ADMIN_IMPERSONATION_TOKEN_KEY);
        window.sessionStorage.removeItem(ADMIN_IMPERSONATION_STORAGE_KEY);
        window.localStorage.setItem("accessToken", data.accessToken);
        return data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequestConfig | undefined;
    const requestUrl = request?.url ?? "";
    const cannotRefresh =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    if (
      error.response?.status !== 401 ||
      !request ||
      request.sessionRetry ||
      cannotRefresh ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    request.sessionRetry = true;
    const wasImpersonating =
      window.sessionStorage.getItem(ADMIN_IMPERSONATION_STORAGE_KEY) === "true";

    try {
      const session = await refreshAccessToken();

      if (wasImpersonating) {
        window.sessionStorage.removeItem(ADMIN_IMPERSONATION_STORAGE_KEY);
        window.dispatchEvent(
          new CustomEvent(AUTH_IDENTITY_CHANGED_EVENT, {
            detail: session,
          }),
        );
        return Promise.reject(error);
      }

      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return api.request(request);
    } catch (refreshError: unknown) {
      expireLocalSession();
      return Promise.reject(refreshError);
    }
  },
);
