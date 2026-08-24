"use client";

import { Camera, ImageOff, Save, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  useRemoveAdminSummitImage,
  useUpdateAdminSummitImageMetadata,
  useUploadAdminSummitImage,
} from "@/hooks/use-admin-summits";
import type { AdminSummitDetail } from "@/lib/admin-summits";
import { getApiErrorMessage } from "../admin-summit-utils";
import styles from "../admin-summits.module.css";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function SummitImageEditor({
  summit,
  onFeedback,
}: {
  summit: AdminSummitDetail;
  onFeedback: (message: string, tone: "success" | "error") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [credit, setCredit] = useState(summit.editorialImageCredit ?? "");
  const [sourceUrl, setSourceUrl] = useState(summit.editorialSourceUrl ?? "");
  const upload = useUploadAdminSummitImage(summit.id);
  const updateMetadata = useUpdateAdminSummitImageMetadata(summit.id);
  const remove = useRemoveAdminSummitImage(summit.id);
  const pending =
    upload.isPending || updateMetadata.isPending || remove.isPending;

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function chooseFile(selected: File | undefined) {
    if (!selected) return;
    if (!ACCEPTED_TYPES.has(selected.type)) {
      onFeedback("Utilise une image JPEG, PNG ou WEBP.", "error");
      return;
    }
    if (selected.size > 8 * 1024 * 1024) {
      onFeedback("L’image dépasse la limite de 8 Mo.", "error");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function save() {
    try {
      if (file) {
        await upload.mutateAsync({
          file,
          input: { imageCredit: credit, sourceUrl },
        });
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        onFeedback("Photo éditoriale optimisée et enregistrée.", "success");
      } else {
        await updateMetadata.mutateAsync({ imageCredit: credit, sourceUrl });
        onFeedback("Crédit et source de la photo mis à jour.", "success");
      }
    } catch (error) {
      onFeedback(getApiErrorMessage(error), "error");
    }
  }

  async function removeEditorialImage() {
    if (
      !window.confirm("Supprimer la photo éditoriale et revenir au fallback ?")
    ) {
      return;
    }
    try {
      await remove.mutateAsync();
      setFile(null);
      setPreview(null);
      setCredit("");
      setSourceUrl("");
      onFeedback(
        "Photo supprimée. Le fallback automatique est rétabli.",
        "success",
      );
    } catch (error) {
      onFeedback(getApiErrorMessage(error), "error");
    }
  }

  const shownImage = preview ?? summit.imageUrl;

  return (
    <section
      className={styles.detailSection}
      aria-labelledby="summit-image-title"
    >
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIcon}>
          <Camera />
        </span>
        <div>
          <span className={styles.kicker}>Image principale</span>
          <h3 id="summit-image-title">Photo éditoriale</h3>
        </div>
      </div>

      <div className={styles.imageEditor}>
        <div className={styles.imagePreview}>
          {shownImage ? (
            <Image
              src={shownImage}
              alt={`Aperçu de ${summit.name}`}
              fill
              sizes="(max-width: 1180px) 100vw, 440px"
              className={styles.imagePreviewMedia}
              unoptimized={Boolean(preview)}
            />
          ) : (
            <span>
              <ImageOff /> Aucun visuel disponible
            </span>
          )}
          <small>
            {preview
              ? "Aperçu local — pas encore enregistré"
              : summit.editorialImageUrl
                ? "Photo éditoriale prioritaire"
                : summit.automaticImageUrl
                  ? "Fallback automatique actuel"
                  : "Fallback générique HOVREN"}
          </small>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenFileInput}
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />{" "}
          {summit.editorialImageUrl ? "Remplacer" : "Choisir une photo"}
        </button>

        <label className={styles.fieldGroup}>
          <span>Crédit photo</span>
          <input
            value={credit}
            maxLength={200}
            onChange={(event) => setCredit(event.target.value)}
            placeholder="Photographe, licence…"
          />
        </label>
        <label className={styles.fieldGroup}>
          <span>Source de la photo</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://…"
          />
        </label>

        <div className={styles.imageActions}>
          {summit.editorialImageUrl ? (
            <button
              type="button"
              className={styles.dangerButton}
              disabled={pending}
              onClick={() => void removeEditorialImage()}
            >
              <Trash2 /> Revenir au fallback
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primaryButton}
            disabled={pending || (!file && !summit.editorialImageUrl)}
            onClick={() => void save()}
          >
            <Save /> {pending ? "Enregistrement…" : "Enregistrer la photo"}
          </button>
        </div>
        <p className={styles.imageHelp}>
          JPEG, PNG ou WEBP · 8 Mo maximum · conversion automatique en WEBP.
        </p>
      </div>
    </section>
  );
}
