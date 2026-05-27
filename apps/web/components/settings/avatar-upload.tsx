"use client";

import { Camera } from "lucide-react";

interface AvatarUploadProps {
  firstName: string;
}

export function AvatarUpload({
  firstName,
}: AvatarUploadProps) {
  return (
    <div className="flex items-center gap-5">

      {/* AVATAR */}
      <div className="relative">

        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl font-bold text-white shadow-lg shadow-violet-500/20">
          {firstName.charAt(0)}
        </div>

        {/* BUTTON */}
        <button
          className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black text-zinc-300 transition hover:border-violet-500/30 hover:text-white"
          type="button"
        >
          <Camera size={18} />
        </button>
      </div>

      {/* TEXT */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          Photo de profil
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          PNG ou JPG jusqu’à 5MB.
        </p>
      </div>
    </div>
  );
}