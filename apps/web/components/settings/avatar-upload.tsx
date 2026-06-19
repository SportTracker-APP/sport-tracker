"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Camera, Check, Loader2 } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(user?.avatarUrl ?? null);
  }, [user?.avatarUrl]);

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    if (
      ![
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ].includes(file.type)
    ) {
      setError("Format invalide.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await api.post<{ avatarUrl: string }>(
        "/upload/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const profileResponse = await api.patch("/users/profile", {
        avatarUrl: uploadResponse.data.avatarUrl,
      });

      const updatedUser = profileResponse.data;

      setUser(updatedUser);
      setPreview(updatedUser.avatarUrl);
      setSuccess(true);

      window.setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (uploadError: unknown) {
      console.error(uploadError);
      setError("Erreur lors de l’upload.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  const initial = firstName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="app-settings-avatar-row">
      <div className="app-settings-avatar-shell">
        <div className="app-settings-avatar">
          {preview ? (
            <Image
              src={preview}
              alt={`Photo de profil de ${firstName}`}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="app-settings-avatar-initial">{initial}</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUpload}
        />

        <button
          type="button"
          aria-label="Modifier la photo de profil"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="app-settings-avatar-action"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : success ? (
            <Check size={18} />
          ) : (
            <Camera size={18} />
          )}
        </button>
      </div>

      <div className="app-settings-avatar-copy">
        <h3>Photo de profil</h3>
        <p>PNG, JPG ou WEBP jusqu’à 5 Mo.</p>

        {success && <small className="app-settings-success">Photo mise à jour.</small>}
        {error && <small className="app-settings-error">{error}</small>}
      </div>
    </div>
  );
}
