import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

import styles from "../dashboard.module.css";
import { getSportIcon, getSportLabel } from "../utils/activity-calculations";
import {
  formatDistance,
  formatDuration,
  formatShortDate,
} from "../utils/date-format";
import { getActivityPhotoUrl } from "../utils/media";

function getTraceToneClass(sport: SportActivity["sport"]) {
  if (["MTB", "ROAD_CYCLING", "GRAVEL"].includes(sport)) {
    return styles.traceToneBike;
  }

  if (["TRAIL", "HIKING"].includes(sport)) {
    return styles.traceToneMountain;
  }

  if (["RUNNING", "WALKING"].includes(sport)) {
    return styles.traceToneRun;
  }

  return styles.traceToneDefault;
}

export function RecentTraceList({
  activities,
  totalCount,
}: {
  activities: SportActivity[];
  totalCount: number;
}) {
  if (activities.length === 0) {
    return (
      <div className={styles.emptyState}>
        Aucune activité récente à afficher.
      </div>
    );
  }

  return (
    <div className={styles.traceCollection}>
      <div className={styles.traceList}>
        {activities.map((activity) => {
          const Icon = getSportIcon(activity.sport);
          const photoUrl = getActivityPhotoUrl(activity);

          return (
            <Link
              key={activity.id}
              href={`/activites/${activity.id}`}
              className={styles.traceItem}
            >
              <div
                className={`${styles.traceThumbnail} ${getTraceToneClass(activity.sport)} ${
                  photoUrl ? styles.traceThumbnailHasPhoto : ""
                }`}
                style={
                  photoUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, var(--trace-photo-overlay-start), var(--trace-photo-overlay-end)), url(${JSON.stringify(
                          photoUrl,
                        )})`,
                      }
                    : undefined
                }
              >
                {!photoUrl ? (
                  <>
                    <span className={styles.traceThumbnailSun} />
                    <span className={styles.traceThumbnailRidge} />
                  </>
                ) : null}
                <Icon aria-hidden="true" />
              </div>
              <div className={styles.traceContent}>
                <div className={styles.traceTitleRow}>
                  <span className={styles.traceSport}>
                    {getSportLabel(activity)}
                  </span>
                  <p className={styles.traceTitle}>{activity.title}</p>
                </div>
                <p className={styles.traceMeta}>
                  {formatShortDate(activity.startedAt)}
                  <span>•</span>
                  {formatDistance(activity.distance || 0, 1)}
                  <span>•</span>
                  {formatDuration(activity.duration)}
                </p>
              </div>
              <ChevronRight className={styles.traceArrow} aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <Link href="/activites" className={styles.traceFooter}>
        <span>
          {activities.length}{" "}
          {activities.length === 1 ? "dernière sortie" : "dernières sorties"}
          {totalCount > activities.length ? ` · ${totalCount} au total` : ""}
        </span>
        <strong>Voir l’historique</strong>
        <ChevronRight aria-hidden="true" />
      </Link>
    </div>
  );
}
