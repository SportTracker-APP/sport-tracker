"use client";

import { useAuthStore } from "@/store/auth-store";

import { AvatarUpload } from "./avatar-upload";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

export function ProfileSettingsCard() {
  const user = useAuthStore(
    (state) => state.user,
  );

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
          user?.firstName || "U"
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
            defaultValue={
              user?.firstName
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
            defaultValue={user?.email}
            className="h-12 border-white/10 bg-black/10 text-zinc-500"
          />
        </div>

        {/* BUTTON */}
        <Button className="h-11 rounded-2xl bg-violet-500 px-6 hover:bg-violet-400">
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}