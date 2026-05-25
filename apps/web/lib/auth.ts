import { api } from "./api";

export interface AuthUser {
  id: string;

  firstName: string;

  email: string;
}

export interface AuthResponse {
  accessToken: string;

  user: AuthUser;
}

export async function registerUser(
  firstName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } =
    await api.post<AuthResponse>(
      "/auth/register",
      {
        firstName,

        email,

        password,
      },
    );

  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } =
    await api.post<AuthResponse>(
      "/auth/login",
      {
        email,

        password,
      },
    );

  return data;
}

export async function getMe() {
  const { data } =
    await api.get("/auth/me");

  return data;
}