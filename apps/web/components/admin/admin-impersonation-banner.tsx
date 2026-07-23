"use client";

import { LogOut, ShieldCheck } from "lucide-react";

import { stopAdminImpersonation } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

import styles from "./admin-impersonation-banner.module.css";

export function AdminImpersonationFrame({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const impersonation = user?.impersonation;

  if (!user || !impersonation) {
    return children;
  }

  async function leaveAdminMode() {
    try {
      const session = await stopAdminImpersonation();
      setAuth(session.accessToken, session.user);
      window.location.assign("/admin");
    } catch {
      window.location.assign("/admin");
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.banner} role="status">
        <ShieldCheck aria-hidden="true" size={17} />
        <p className={styles.message}>
          <span className={styles.label}>Mode admin</span>
          Vous consultez le compte de <strong>{user.firstName}</strong>{" "}
          ({user.email})
        </p>
        <button
          type="button"
          className={styles.button}
          onClick={() => void leaveAdminMode()}
          aria-label="Quitter le mode admin et revenir à l’administration"
        >
          <LogOut aria-hidden="true" size={15} />
          <span className={styles.buttonText}>Quitter le mode admin</span>
        </button>
      </div>
      {children}
    </div>
  );
}
