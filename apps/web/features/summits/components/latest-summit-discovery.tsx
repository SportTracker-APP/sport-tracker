import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Mountain,
  Route,
} from "lucide-react";

import type { SummitView } from "@/lib/summit-discovery";

import type { SummitVisualSource } from "../summits-types";
import {
  formatActivityDistance,
  formatElevationGain,
  formatSummitAltitude,
  formatSummitDate,
  getSummitHref,
} from "../summits-utils";
import styles from "../summits.module.css";
import { SummitVisual } from "./summit-visual";

export function LatestSummitDiscovery({
  summit,
  fallbackSummit,
  visual,
}: {
  summit: SummitView | undefined;
  fallbackSummit: SummitView | undefined;
  visual?: SummitVisualSource;
}) {
  if (!summit) {
    return (
      <section className={styles.latestEmpty}>
        <div className={styles.latestEmptyArtwork} aria-hidden="true">
          {fallbackSummit ? (
            <SummitVisual
              summit={fallbackSummit}
              sizes="(max-width: 900px) 100vw, 38vw"
              className={styles.latestEmptyPhoto}
              showCredit={false}
            />
          ) : (
            <span className={styles.latestEmptyPhotoFallback} />
          )}
          <span className={styles.latestEmptyPhotoShade} />
        </div>
        <div>
          <span className={styles.sectionLabel}>Ton carnet commence ici</span>
          <h2>Ta première découverte t’attend.</h2>
          <p>
            Synchronise une trace ou pars explorer un sommet : HOVREN reliera ta
            sortie au lieu traversé.
          </p>
          <Link
            href={
              fallbackSummit ? getSummitHref(fallbackSummit) : "/exploration"
            }
            className={styles.paperButton}
          >
            {fallbackSummit
              ? `Découvrir ${fallbackSummit.name}`
              : "Ouvrir l’exploration"}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  const activity = summit.firstActivity ?? summit.latestActivity;
  const activityDistance = formatActivityDistance(activity?.distance ?? null);
  const elevationGain = formatElevationGain(activity?.elevationGain ?? null);
  const passageLabel =
    summit.activityCount > 1
      ? `${summit.activityCount} passages`
      : "Premier passage";
  const activityMetrics = [
    activityDistance,
    elevationGain,
    passageLabel,
  ].filter((metric): metric is string => Boolean(metric));

  return (
    <section className={styles.latestDiscovery}>
      <div className={styles.latestPhoto}>
        <SummitVisual
          summit={summit}
          priority
          sizes="(max-width: 900px) 100vw, 58vw"
          className={styles.latestPhotoImage}
          visual={visual}
        />
        <div className={styles.latestPhotoShade} />
      </div>

      <div className={styles.latestPaper}>
        <div className={styles.latestHeading}>
          <div>
            <span className={styles.sectionLabel}>Dernière découverte</span>
            <h2>{summit.name}</h2>
          </div>
          <span className={styles.validatedStamp}>Sommet validé</span>
        </div>

        <div className={styles.latestMeta}>
          <span>
            <Mountain aria-hidden="true" />
            {formatSummitAltitude(summit.altitude)}
          </span>
          <span>
            <MapPin aria-hidden="true" />
            {summit.massif}
          </span>
          <span>
            <CalendarDays aria-hidden="true" />
            {formatSummitDate(summit.firstDiscoveredAt ?? activity?.startedAt)}
          </span>
        </div>

        {activity ? (
          <div className={styles.discoveryStory}>
            <Route aria-hidden="true" />
            <p>
              Découvert pendant « {activity.title ?? "une trace sans titre"} »
            </p>
            {activityMetrics.length > 0 ? (
              <span>{activityMetrics.join(" · ")}</span>
            ) : null}
          </div>
        ) : (
          <p className={styles.discoveryNarrative}>
            Ce sommet fait désormais partie de ton histoire outdoor.
          </p>
        )}

        <dl className={styles.discoveryDetails}>
          <div>
            <dt>Massif</dt>
            <dd>{summit.massif}</dd>
          </div>
          <div>
            <dt>Difficulté</dt>
            <dd>{summit.difficulty}</dd>
          </div>
          <div>
            <dt>Passages</dt>
            <dd>{summit.activityCount}</dd>
          </div>
        </dl>

        <div className={styles.latestActions}>
          {activity ? (
            <Link
              href={`/activites/${activity.id}`}
              className={styles.paperButton}
            >
              Voir la trace liée
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ) : null}
          <Link href={getSummitHref(summit)} className={styles.textAction}>
            Voir dans le carnet
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
