"use client";

import Image from "next/image";
import { useState } from "react";

import { getEditorialActivityImage } from "@/lib/mountain-visuals";

import type { ActivityViewModel } from "../activities-types";
import styles from "../activities.module.css";

export function ActivityMediaPreview({
  activity,
  featured = false,
}: {
  activity: ActivityViewModel;
  featured?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasUsablePhoto = Boolean(activity.photoUrl) && !imageFailed;
  const visualUrl = hasUsablePhoto && activity.photoUrl
    ? activity.photoUrl
    : getEditorialActivityImage(activity.id, activity.sport);

  return (
    <div className={styles.media} data-featured={featured}>
      <Image
        src={visualUrl}
        alt={
          hasUsablePhoto
            ? `Souvenir de la sortie ${activity.title}`
            : `Paysage outdoor sélectionné pour ${activity.title}`
        }
        fill
        sizes={
          featured
            ? "(max-width: 900px) 100vw, 48vw"
            : "(max-width: 760px) 100vw, 230px"
        }
        priority={featured}
        className={styles.mediaImage}
        onError={() => setImageFailed(true)}
      />
      <span className={styles.imageWash} aria-hidden="true" />
      <span className={styles.visualSource}>
        {hasUsablePhoto ? "Souvenir de sortie" : "Sélection HOVREN"}
      </span>
    </div>
  );
}
