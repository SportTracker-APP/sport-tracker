"use client";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

export function PasswordSettingsCard() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white">
          Sécurité
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Modifiez votre mot de passe.
        </p>
      </div>

      {/* FORM */}
      <div className="space-y-5">

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Mot de passe actuel
          </label>

          <Input
            type="password"
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Nouveau mot de passe
          </label>

          <Input
            type="password"
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Confirmation
          </label>

          <Input
            type="password"
            className="h-12 border-white/10 bg-black/20 text-white"
          />
        </div>

        <Button className="h-11 rounded-2xl bg-violet-500 px-6 hover:bg-violet-400">
          Modifier le mot de passe
        </Button>
      </div>
    </div>
  );
}