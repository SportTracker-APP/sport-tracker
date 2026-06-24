import { api } from "./api";

export interface AuthUser {
  id: string;

  firstName: string;

  email: string;

  role?: "USER" | "ADMIN";

  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;

  refreshToken: string;

  user: AuthUser;
}

export async function registerUser(
  firstName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    firstName,
    email,
    password,
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
