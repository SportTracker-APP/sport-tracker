"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { AvatarUpload } from "./avatar-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

import styles from "./settings.module.css";

export function ProfileSettingsCard() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    try {
      setIsSaving(true);

      const response = await api.patch("/users/profile", {
        firstName: firstName.trim(),
      });

      setUser(response.data);
    } catch (error: unknown) {
      console.error(error);
      window.alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.cardContent}>
      <header className={styles.cardHeader}>
        <h2>Profil</h2>
        <p>Modifie tes informations personnelles.</p>
      </header>

      <AvatarUpload firstName={firstName || "U"} avatarUrl={user?.avatarUrl} />

      <div className={styles.formStack}>
        <div className={styles.field}>
          <label htmlFor="profile-first-name">Prénom</label>

          <Input
            id="profile-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="profile-email">Email</label>

          <Input
            id="profile-email"
            disabled
            value={user?.email || ""}
            className={styles.input}
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            type="button"
            onClick={handleSave}
            disabled={isSaving || !firstName.trim()}
            className={styles.primaryAction}
          >
            {isSaving ? (
              <>
                <Loader2 className={styles.spinner} />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
