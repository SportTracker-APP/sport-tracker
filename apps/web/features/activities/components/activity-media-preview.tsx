"use client";

import Image from "next/image";
import { useState } from "react";

import type { ActivityViewModel } from "../activities-types";
import styles from "../activities.module.css";
import { ActivityRouteSketch } from "./activity-route-sketch";
import { ActivitySportIcon } from "./activity-sport-icon";

function PaperFallback({ activity }: { activity: ActivityViewModel }) {
  return (
    <div className={styles.mediaFallback}>
      <svg viewBox="0 0 320 180" aria-hidden="true">
        <path d="M-15 169 66 73l48 48 55-77 54 70 44-45 68 100Z" />
        <path d="M-15 179 76 111l45 34 58-58 47 52 45-29 64 69Z" />
        <path d="M18 44c59-34 96-7 123-24s71-15 93 5 48 15 76-9" />
      </svg>
      <span className={styles.fallbackSportIcon}>
        <ActivitySportIcon sport={activity.sport} />
      </span>
      <p>{activity.sportLabel}</p>
    </div>
  );
}

export function ActivityMediaPreview({
  activity,
  featured = false,
}: {
  activity: ActivityViewModel;
  featured?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasUsablePhoto = Boolean(activity.photoUrl) && !imageFailed;

  return (
    <div className={styles.media} data-featured={featured}>
      {hasUsablePhoto && activity.photoUrl ? (
        <>
          <Image
            src={activity.photoUrl}
            alt={`Souvenir de la sortie ${activity.title}`}
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
          <span className={styles.visualSource}>Souvenir de sortie</span>
        </>
      ) : activity.routePolyline ? (
        <>
          <ActivityRouteSketch
            polyline={activity.routePolyline}
            compact={!featured}
          />
          <span className={styles.visualSource}>Trace GPS</span>
        </>
      ) : (
        <>
          <PaperFallback activity={activity} />
          <span className={styles.visualSource}>Carnet HOVREN</span>
        </>
      )}
    </div>
  );
}
