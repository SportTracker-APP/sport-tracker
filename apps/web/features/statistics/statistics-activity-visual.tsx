import { MapPin, Route } from "lucide-react";

import type { Activity } from "@/lib/activities";

import { getSportLabel } from "./statistics-utils";
import styles from "./statistics.module.css";

function getVisualUrl(activity: Activity) {
  return activity.coverImageUrl ?? activity.photoUrls?.[0] ?? null;
}

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
  const visualUrl = visualSource === "hovren"
    ? HOVREN_EDITORIAL_VISUAL
    : getVisualUrl(activity);
  const hasRoute = Boolean(activity.routePolyline);
  const location = activity.city || activity.country;

  return (
    <div
      className={styles.activityVisual}
      data-compact={compact || undefined}
      data-has-photo={Boolean(visualUrl) || undefined}
      data-placement={placement === "hero" ? "hero" : undefined}
      style={visualUrl ? { backgroundImage: `url("${visualUrl}")` } : undefined}
    >
      <div className={styles.activityVisualFallback} aria-hidden="true">
        <svg viewBox="0 0 640 380" fill="none">
          <path d="M0 380 135 188l91 84L347 89l91 151 69-66 133 206H0Z" fill="#aab7a5" fillOpacity=".42" />
          <path d="M0 380 166 263l92 78 126-128 94 91 61-49 101 125H0Z" fill="#2f5d46" fillOpacity=".28" />
          <path d="M54 279c75-53 116-67 169-45 45 18 75 72 137 40 56-29 79-93 141-85 42 6 59 42 92 49" stroke="#c85b2f" strokeWidth="3" strokeDasharray="8 11" strokeLinecap="round" />
          <path d="M82 114c45-61 118-61 163 0-45 61-118 61-163 0Z" stroke="#2f5d46" strokeOpacity=".18" />
          <path d="M105 114c32-42 84-42 116 0-32 42-84 42-116 0Z" stroke="#2f5d46" strokeOpacity=".2" />
          <path d="M410 88c31-42 82-42 113 0-31 42-82 42-113 0Z" stroke="#2f5d46" strokeOpacity=".16" />
        </svg>
      </div>

      <div className={styles.activityVisualVeil} aria-hidden="true" />
      <div className={styles.activityVisualTopline}>
        <span>{eyebrow}</span>
        {placement !== "hero" ? (
          <span className={styles.activityVisualSource}>
            {visualSource === "hovren"
              ? "Sélection HOVREN"
              : visualUrl
                ? "Souvenir de sortie"
                : hasRoute
                  ? "Trace GPS"
                  : "Carnet HOVREN"}
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
