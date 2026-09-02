import { api } from "./api";

export interface AdminImpersonationContext {
  sessionId: string;
  adminId: string;
  adminEmail: string;
  adminFirstName: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;

  firstName: string;

  email: string;

  role?: "USER" | "ADMIN";

  avatarUrl?: string | null;

  needsDiscoveryOnboarding?: boolean;

  impersonation?: AdminImpersonationContext | null;
}

export interface AuthResponse {
  accessToken: string;

  user: AuthUser;
}

export async function registerUser(
  firstName: string,
  email: string,
  password: string,
): Promise<GenericAuthMessageResponse> {
  const { data } = await api.post<GenericAuthMessageResponse>(
    "/auth/register",
    {
      firstName,
      email,
      password,
    },
  );

  return data;
}

export async function verifyEmail(token: string): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>("/auth/verify-email", {
    params: {
      token,
    },
  });

  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  return data;
}

export function getGoogleAuthorizationUrl(returnTo = "/refuge"): string {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const authorizationUrl = new URL("/auth/google", apiBaseUrl);

  authorizationUrl.searchParams.set("returnTo", returnTo);

  return authorizationUrl.toString();
}

export async function completeGoogleLogin(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/refresh");

  return data;
}

export async function logoutSession(): Promise<void> {
  if (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("hovren:admin-impersonation-token")
  ) {
    try {
      await api.post("/admin/impersonation/stop");
    } catch {
      // An expired delegated session must never prevent a regular logout.
    }
  }

  await api.post("/auth/logout");
}

export interface GenericAuthMessageResponse {
  message: string;
}

export async function forgotPassword(
  email: string,
): Promise<GenericAuthMessageResponse> {
  const { data } = await api.post<GenericAuthMessageResponse>(
    "/auth/forgot-password",
    {
      email,
    },
  );

  return data;
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<GenericAuthMessageResponse> {
  const { data } = await api.post<GenericAuthMessageResponse>(
    "/auth/reset-password",
    {
      token,
      password,
      confirmPassword,
    },
  );

  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/users/me");

  return data;
}

export async function startAdminImpersonation(
  userId: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(
    `/admin/users/${userId}/impersonate`,
  );

  return data;
}

export async function stopAdminImpersonation(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/admin/impersonation/stop");

  return data;
}
