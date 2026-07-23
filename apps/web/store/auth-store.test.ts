import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AuthUser } from "@/lib/auth";

import { useAuthStore } from "./auth-store";

const adminUser: AuthUser = {
  id: "admin-1",
  firstName: "Thibaut",
  email: "admin@example.test",
  role: "ADMIN",
};

const impersonatedUser: AuthUser = {
  id: "user-1",
  firstName: "Camille",
  email: "camille@example.test",
  role: "USER",
  impersonation: {
    sessionId: "session-1",
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    adminFirstName: adminUser.firstName,
    expiresAt: "2099-07-23T12:00:00.000Z",
  },
};

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("auth store admin impersonation", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: new MemoryStorage(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: new MemoryStorage(),
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      user: null,
    });
  });

  it("keeps the admin token persistent and stores the client token per tab", () => {
    window.localStorage.setItem("accessToken", "admin-token");

    useAuthStore.getState().setAuth("client-token", impersonatedUser);

    expect(window.localStorage.getItem("accessToken")).toBe("admin-token");
    expect(
      window.sessionStorage.getItem("hovren:admin-impersonation-token"),
    ).toBe("client-token");
    expect(
      window.sessionStorage.getItem("hovren:admin-impersonation"),
    ).toBe("true");
  });

  it("removes all client access when logging out", () => {
    window.localStorage.setItem("accessToken", "admin-token");
    useAuthStore.getState().setAuth("client-token", impersonatedUser);

    useAuthStore.getState().logout();

    expect(window.localStorage.getItem("accessToken")).toBeNull();
    expect(
      window.sessionStorage.getItem("hovren:admin-impersonation-token"),
    ).toBeNull();
    expect(
      window.sessionStorage.getItem("hovren:admin-impersonation"),
    ).toBeNull();
  });

  it("restores the normal admin session when leaving admin mode", () => {
    window.localStorage.setItem("accessToken", "old-admin-token");
    useAuthStore.getState().setAuth("client-token", impersonatedUser);

    useAuthStore.getState().setAuth("new-admin-token", adminUser);

    expect(window.localStorage.getItem("accessToken")).toBe("new-admin-token");
    expect(
      window.sessionStorage.getItem("hovren:admin-impersonation-token"),
    ).toBeNull();
  });
});
