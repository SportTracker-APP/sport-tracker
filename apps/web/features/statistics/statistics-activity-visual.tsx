import { MapPin, Route } from "lucide-react";

import type { Activity } from "@/lib/activities";
import { getEditorialActivityImage } from "@/lib/mountain-visuals";

import { getSportLabel } from "./statistics-utils";
import styles from "./statistics.module.css";

const HOVREN_EDITORIAL_VISUAL = "/landing/summit-discovery-wildflowers.jpg";

function formatVisualDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function StatisticsActivityVisual({
  activity,
  eyebrow,
  compact = false,
  placement = "default",
  visualSource = "activity",
}: {
  activity: Activity;
  eyebrow: string;
  compact?: boolean;
  placement?: "default" | "hero";
  visualSource?: "activity" | "hovren";
}) {
  const activityPhotoUrl = activity.coverImageUrl ?? activity.photoUrls?.[0] ?? null;
  const fallbackUrl = visualSource === "hovren"
    ? HOVREN_EDITORIAL_VISUAL
    : getEditorialActivityImage(activity.id, activity.sport);
  const visualUrl = visualSource === "activity" && activityPhotoUrl
    ? activityPhotoUrl
    : fallbackUrl;
  const backgroundImage = visualUrl === fallbackUrl
    ? `url(${JSON.stringify(fallbackUrl)})`
    : `url(${JSON.stringify(visualUrl)}), url(${JSON.stringify(fallbackUrl)})`;
  const hasActivityPhoto = Boolean(activityPhotoUrl);
  const hasRoute = Boolean(activity.routePolyline);
  const location = activity.city || activity.country;

  return (
    <div
      className={styles.activityVisual}
      data-compact={compact || undefined}
      data-has-photo="true"
      data-placement={placement === "hero" ? "hero" : undefined}
      style={{ backgroundImage }}
    >
      <div className={styles.activityVisualVeil} aria-hidden="true" />
      <div className={styles.activityVisualTopline}>
        <span>{eyebrow}</span>
        {placement !== "hero" ? (
          <span className={styles.activityVisualSource}>
            {visualSource === "hovren" || !hasActivityPhoto
              ? "Sélection HOVREN"
              : "Souvenir de sortie"}
          </span>
        ) : null}
      </div>
      <div className={styles.activityVisualCopy}>
        <div className={styles.activityVisualIcon} aria-hidden="true">
          {hasRoute ? <Route /> : <MapPin />}
        </div>
        <div>
          <strong>{activity.title?.trim() || "Une trace sans titre"}</strong>
          <span>
            {getSportLabel(activity.sport)} · {formatVisualDate(activity.startedAt)}
            {location ? ` · ${location}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
