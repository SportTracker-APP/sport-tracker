"use client";

import { useState } from "react";
import axios from "axios";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

import styles from "./settings.module.css";

export function PasswordSettingsCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpdatePassword() {
    setSuccessMessage("");
    setErrorMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "Le nouveau mot de passe doit contenir au moins 6 caractères.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setIsSaving(true);

      await api.patch("/users/password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Mot de passe mis à jour avec succès.");
    } catch (error: unknown) {
      console.error(error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;

      setErrorMessage(
        typeof message === "string"
          ? message
          : "Erreur lors de la mise à jour.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.cardContent}>
      <header className={styles.cardHeader}>
        <h2>Sécurité</h2>
        <p>Modifie ton mot de passe.</p>
      </header>

      <div className={styles.formStack}>
        <div className={styles.field}>
          <label htmlFor="current-password">Mot de passe actuel</label>

          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="new-password">Nouveau mot de passe</label>

          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="confirm-password">Confirmation</label>

          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={styles.input}
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className={`${styles.feedback} ${styles.feedbackError}`}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className={`${styles.feedback} ${styles.feedbackSuccess}`}
          >
            {successMessage}
          </div>
        )}

        <div className={styles.actions}>
          <Button
            variant="ghost"
            type="button"
            onClick={handleUpdatePassword}
            disabled={isSaving}
            className={styles.primaryAction}
          >
            {isSaving ? (
              <>
                <Loader2 className={styles.spinner} />
                Mise à jour...
              </>
            ) : (
              "Modifier le mot de passe"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
