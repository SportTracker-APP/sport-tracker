"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { api } from "@/lib/api";

import { useAuthStore } from "@/store/auth-store";

import { AvatarUpload } from "./avatar-upload";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

export function ProfileSettingsCard() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const [firstName, setFirstName] =
    useState(user?.firstName || "");

  const [isSaving, setIsSaving] =
    useState(false);

  async function handleSave() {
    try {
      setIsSaving(true);

      const response = await api.patch(
        "/users/profile",
        {
          firstName,
        },
      );

      setUser(response.data);

    } catch (error) {
      console.error(error);

      alert(
        "Erreur lors de la sauvegarde.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white">
          Profil
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Modifiez vos informations personnelles.
        </p>
      </div>

      {/* AVATAR */}
      <AvatarUpload
        firstName={
          firstName || "U"
        }
        avatarUrl={
          user?.avatarUrl
        }
      />

      {/* FORM */}
      <div className="mt-8 space-y-5">

        {/* FIRST NAME */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Prénom
          </label>

          <Input
            value={firstName}
            onChange={(e) =>
              setFirstName(
                e.target.value,
              )
            }
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        {/* EMAIL */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Email
          </label>

          <Input
            disabled
            value={user?.email || ""}
            className="h-12 border-white/10 bg-black/10 text-zinc-500"
          />
        </div>

        {/* BUTTON */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 rounded-2xl bg-violet-500 px-6 hover:bg-violet-400"
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
  );
}