"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { AvatarUpload } from "./avatar-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

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
    <div className="app-settings-card-content">
      <header className="app-settings-card-header">
        <h2>Profil</h2>
        <p>Modifiez vos informations personnelles.</p>
      </header>

      <AvatarUpload
        firstName={firstName || "U"}
        avatarUrl={user?.avatarUrl}
      />

      <div className="app-settings-form-stack">
        <div className="app-settings-field">
          <label htmlFor="profile-first-name">Prénom</label>

          <Input
            id="profile-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="h-12"
          />
        </div>

        <div className="app-settings-field">
          <label htmlFor="profile-email">Email</label>

          <Input
            id="profile-email"
            disabled
            value={user?.email || ""}
            className="h-12"
          />
        </div>

        <div className="app-settings-actions">
          <Button
            variant="ghost"
            type="button"
            onClick={handleSave}
            disabled={isSaving || !firstName.trim()}
            className="app-settings-primary-action h-11 rounded-2xl px-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
