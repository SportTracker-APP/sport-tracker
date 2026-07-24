import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import type { ActivityViewModel } from "../activities-types";
import styles from "../activities.module.css";
import { ActivityMediaPreview } from "./activity-media-preview";
import { ActivityMetrics } from "./activity-metrics";
import { ActivitySportIcon } from "./activity-sport-icon";

export function ActivityJournalEntry({
  activity,
}: {
  activity: ActivityViewModel;
}) {
  return (
    <article className={styles.journalEntry}>
      <time className={styles.entryDate} dateTime={activity.startedAt}>
        <strong>{activity.dateDay}</strong>
        <span>{activity.dateMonth}</span>
        <small>{activity.dateYear}</small>
      </time>

      <div className={styles.entryCopy}>
        <div className={styles.entrySport}>
          <ActivitySportIcon sport={activity.sport} />
          {activity.sportLabel}
          {activity.isFromStrava ? <span>· Strava</span> : null}
        </div>
        <h3>
          <Link href={`/activites/${activity.id}`}>{activity.title}</Link>
        </h3>
        {activity.locationLabel ? (
          <p className={styles.entryLocation}>
            <MapPin aria-hidden="true" />
            {activity.locationLabel}
          </p>
        ) : null}
        <ActivityMetrics metrics={activity.metrics} compact />
        <Link
          href={`/activites/${activity.id}`}
          className={styles.entryLink}
          aria-label={`Voir la sortie ${activity.title}`}
        >
          Voir la trace
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <ActivityMediaPreview activity={activity} />
    </article>
  );
}
