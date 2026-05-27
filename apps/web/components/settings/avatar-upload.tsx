"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Image from "next/image";

import {
  Camera,
  Check,
  Loader2,
} from "lucide-react";

import { api } from "@/lib/api";

import { useAuthStore } from "@/store/auth-store";

interface AvatarUploadProps {
  firstName: string;
  avatarUrl?: string | null;
}

export function AvatarUpload({
  firstName,
  avatarUrl,
}: AvatarUploadProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const user = useAuthStore(
    (state) => state.user,
  );

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const [preview, setPreview] =
    useState<string | null>(
      avatarUrl ?? null,
    );

  const [isUploading, setIsUploading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setPreview(
      user?.avatarUrl ?? null,
    );
  }, [user?.avatarUrl]);

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError(null);

    // VALIDATION
    if (
      ![
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ].includes(file.type)
    ) {
      setError(
        "Format invalide.",
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image trop lourde.",
      );

      return;
    }

    // PREVIEW LOCALE
    const localPreview =
      URL.createObjectURL(file);

    setPreview(localPreview);

    try {
      setIsUploading(true);

      // UPLOAD IMAGE
      const formData = new FormData();

      formData.append("file", file);

      const uploadResponse =
        await api.post(
          "/upload/avatar",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          },
        );

      const uploadedAvatarUrl =
        uploadResponse.data.avatarUrl;

      // SAVE USER PROFILE
      const profileResponse =
        await api.patch(
          "/users/profile",
          {
            avatarUrl:
              uploadedAvatarUrl,
          },
        );

console.log(
  "PROFILE RESPONSE",
  profileResponse.data,
);

      const updatedUser =
        profileResponse.data;

      // UPDATE STORE
      setUser(updatedUser);

      // UPDATE UI
      setPreview(
        updatedUser.avatarUrl,
      );

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        "Erreur lors de l’upload.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-5">

      {/* AVATAR */}
      <div className="relative">

        <div className="relative h-24 w-24 overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">

          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {firstName.charAt(0)}
            </div>
          )}

          {/* LIGHT */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent_40%)]" />
        </div>

        {/* INPUT */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUpload}
        />

        {/* BUTTON */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() =>
            inputRef.current?.click()
          }
          className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/90 text-zinc-300 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : success ? (
            <Check
              size={18}
              className="text-emerald-400"
            />
          ) : (
            <Camera size={18} />
          )}
        </button>
      </div>

      {/* TEXT */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          Photo de profil
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          PNG, JPG ou WEBP jusqu’à 5MB.
        </p>

        {success && (
          <p className="mt-2 text-sm text-emerald-400">
            Photo mise à jour.
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}