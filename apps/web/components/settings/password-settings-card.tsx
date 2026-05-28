"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { api } from "@/lib/api";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

export function PasswordSettingsCard() {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleUpdatePassword() {
    setSuccessMessage("");

    setErrorMessage("");

    // VALIDATION
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setErrorMessage(
        "Veuillez remplir tous les champs.",
      );

      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "Le nouveau mot de passe doit contenir au moins 6 caractères.",
      );

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setErrorMessage(
        "Les mots de passe ne correspondent pas.",
      );

      return;
    }

    try {
      setIsSaving(true);

      await api.patch(
        "/users/password",
        {
          currentPassword,
          newPassword,
        },
      );

      // RESET
      setCurrentPassword("");

      setNewPassword("");

      setConfirmPassword("");

      setSuccessMessage(
        "Mot de passe mis à jour avec succès.",
      );

    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.message ||
          "Erreur lors de la mise à jour.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Sécurité
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Modifiez votre mot de passe.
        </p>
      </div>

      {/* FORM */}
      <div className="space-y-5">

        {/* CURRENT PASSWORD */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Mot de passe actuel
          </label>

          <Input
            type="password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(
                e.target.value,
              )
            }
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        {/* NEW PASSWORD */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Nouveau mot de passe
          </label>

          <Input
            type="password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value,
              )
            }
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Confirmation
          </label>

          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value,
              )
            }
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* SUCCESS */}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* BUTTON */}
        <Button
          type="button"
          onClick={
            handleUpdatePassword
          }
          disabled={isSaving}
          className="h-11 rounded-2xl bg-violet-500 px-6 hover:bg-violet-400"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            "Modifier le mot de passe"
          )}
        </Button>
      </div>
    </div>
  );
}