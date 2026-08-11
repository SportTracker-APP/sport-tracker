"use client";

import axios from "axios";
import Image from "next/image";
import { useRef, useState } from "react";

import { Camera, Check, Loader2 } from "lucide-react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

import styles from "./settings.module.css";

const acceptedAvatarTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

function isHeicImage(file: File) {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

interface AvatarUploadProps {
  firstName: string;
  avatarUrl?: string | null;
}

export function AvatarUpload({ firstName, avatarUrl }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setSuccess(false);

    if (isHeicImage(file)) {
      setError(
        "Le format HEIC/HEIF n’est pas encore pris en charge. Exporte la photo en JPEG, PNG ou WEBP.",
      );
      event.target.value = "";
      return;
    }

    if (!acceptedAvatarTypes.has(file.type)) {
      setError(
        "Format non pris en charge. Utilise une image JPEG, PNG ou WEBP.",
      );
      event.target.value = "";
      return;
    }

    const uploadFile =
      file.type === "image/jpg"
        ? new File([file], file.name, { type: "image/jpeg" })
        : file;

    if (uploadFile.size > 5 * 1024 * 1024) {
      setError("Image trop lourde. La taille maximale est de 5 Mo.");
      event.target.value = "";
      return;
    }

    const previousPreview = preview;
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", uploadFile);

      const uploadResponse = await api.post<{ avatarUrl: string }>(
        "/upload/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (user) {
        setUser({
          ...user,
          avatarUrl: uploadResponse.data.avatarUrl,
        });
      }
      setPreview(uploadResponse.data.avatarUrl);
      setSuccess(true);
      URL.revokeObjectURL(localPreview);

      window.setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (uploadError: unknown) {
      console.error(uploadError);
      URL.revokeObjectURL(localPreview);
      setPreview(previousPreview);

      const backendMessage = axios.isAxiosError(uploadError)
        ? uploadError.response?.data?.message
        : null;

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "La photo n’a pas pu être mise à jour. Réessaie dans quelques instants.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  const initial = firstName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className={styles.avatarRow}>
      <div className={styles.avatarShell}>
        <div className={styles.avatar}>
          {preview ? (
            <Image
              src={preview}
              alt={`Photo de profil de ${firstName}`}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className={styles.avatarInitial}>{initial}</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.heic,.heif"
          className={styles.fileInput}
          onChange={handleUpload}
        />

        <button
          type="button"
          aria-label="Modifier la photo de profil"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className={styles.avatarAction}
        >
          {isUploading ? (
            <Loader2 size={18} className={styles.spinner} />
          ) : success ? (
            <Check size={18} />
          ) : (
            <Camera size={18} />
          )}
        </button>
      </div>

      <div className={styles.avatarCopy}>
        <h3>Photo de profil</h3>
        <p>PNG, JPG ou WEBP jusqu’à 5 Mo.</p>

        {success && (
          <small role="status" className={styles.success}>
            Photo de profil mise à jour.
          </small>
        )}
        {error && (
          <small role="alert" className={styles.error}>
            {error}
          </small>
        )}
      </div>
    </div>
  );
}
