import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const AUTH_SESSION_EXPIRED_EVENT = "hovren:auth-session-expired";

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
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  sessionRetry?: boolean;
};

let refreshRequest: Promise<string> | null = null;

function getStoredAccessToken() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem("accessToken");
}

function expireLocalSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = sessionApi
      .post<RefreshSessionResponse>("/auth/refresh")
      .then(({ data }) => {
        window.localStorage.setItem("accessToken", data.accessToken);
        return data.accessToken;
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

    try {
      const accessToken = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api.request(request);
    } catch (refreshError: unknown) {
      expireLocalSession();
      return Promise.reject(refreshError);
    }
  },
);
