import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";

import type { ActivityViewModel } from "../activities-types";
import styles from "../activities.module.css";
import { ActivityMediaPreview } from "./activity-media-preview";
import { ActivityMetrics } from "./activity-metrics";
import { ActivitySportIcon } from "./activity-sport-icon";

export function FeaturedActivityCard({
  activity,
}: {
  activity: ActivityViewModel;
}) {
  return (
    <article className={styles.featuredCard}>
      <ActivityMediaPreview activity={activity} featured />

      <div className={styles.featuredCopy}>
        <div className={styles.featuredTopline}>
          <p>Dernière page du carnet</p>
          {activity.isFromStrava ? <span>Importée depuis Strava</span> : null}
        </div>

        <div className={styles.featuredIdentity}>
          <span className={styles.featuredIcon}>
            <ActivitySportIcon sport={activity.sport} />
          </span>
          <div>
            <p>{activity.sportLabel}</p>
            <h2>{activity.title}</h2>
          </div>
        </div>

        <p className={styles.featuredDate}>
          <time dateTime={activity.startedAt}>{activity.dateLabel}</time>
          {activity.locationLabel ? (
            <span>
              <MapPin aria-hidden="true" />
              {activity.locationLabel}
            </span>
          ) : null}
        </p>

        <ActivityMetrics metrics={activity.metrics} />

        <Link
          href={`/activites/${activity.id}`}
          className={styles.featuredLink}
        >
          Ouvrir cette page
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
