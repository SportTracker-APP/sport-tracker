import Link from "next/link";
import {
  ArrowRight,
  Check,
  Flag,
  Layers3,
  Mountain,
  Repeat2,
} from "lucide-react";

import type { MassifProgress, SummitView } from "@/lib/summit-discovery";

import type {
  SummitCollectionSummary,
  SummitVisualSource,
} from "../summits-types";
import {
  formatSummitAltitude,
  formatSummitDistance,
  getSummitHref,
} from "../summits-utils";
import styles from "../summits.module.css";
import { SummitVisual } from "./summit-visual";

export function SummitsProgressStrip({
  summary,
}: {
  summary: SummitCollectionSummary;
}) {
  const metrics = [
    {
      label: "Sommets découverts",
      value: summary.discoveredCount,
      icon: Mountain,
    },
    {
      label: "Massifs commencés",
      value: summary.coveredMassifs,
      icon: Layers3,
    },
    {
      label: "Massifs complétés",
      value: summary.completedMassifs,
      icon: Check,
    },
    {
      label: "Passages cumulés",
      value: summary.totalPassages,
      icon: Repeat2,
    },
    {
      label: "Altitude maximale",
      value:
        summary.highestAltitude === null
          ? "—"
          : formatSummitAltitude(summary.highestAltitude),
      icon: Flag,
    },
  ];

  return (
    <section
      className={styles.progressStrip}
      aria-label="Progression du carnet"
    >
      <div className={styles.progressMetrics}>
        {metrics.map(({ label, value, icon: Icon }) => (
          <div className={styles.progressMetric} key={label}>
            <Icon aria-hidden="true" />
            <span>
              <strong>{value}</strong>
              <small>{label}</small>
            </span>
          </div>
        ))}
      </div>
      <div className={styles.globalProgress}>
        <div>
          <span>Progression du carnet</span>
          <strong>{summary.discoveryProgress}%</strong>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.discoveryProgress}
          aria-label={`${summary.discoveryProgress}% du carnet révélé`}
        >
          <span style={{ width: `${summary.discoveryProgress}%` }} />
        </div>
      </div>
    </section>
  );
}

export function MassifAtlas({
  massifs,
  featuredMassif,
  featuredSummit,
  featuredVisual,
  onSelect,
}: {
  massifs: MassifProgress[];
  featuredMassif: MassifProgress | undefined;
  featuredSummit: SummitView | undefined;
  featuredVisual: SummitVisualSource | null;
  onSelect: (massif: string) => void;
}) {
  const otherMassifs = featuredMassif
    ? massifs.filter((massif) => massif.massif !== featuredMassif.massif)
    : massifs;

  return (
    <section className={styles.atlasSection}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.sectionLabel}>Atlas personnel</span>
          <h2>Ton atlas prend forme</h2>
        </div>
        <p>
          Chaque massif devient une collection à compléter au fil de tes traces.
        </p>
      </div>

      {massifs.length === 0 ? (
        <div className={styles.localEmpty}>
          L’atlas apparaîtra dès que le catalogue de sommets sera disponible.
        </div>
      ) : (
        <>
          {featuredMassif ? (
            <article className={styles.featuredMassif}>
              <div className={styles.featuredMassifVisual}>
                {featuredSummit ? (
                  <SummitVisual
                    summit={featuredSummit}
                    visual={featuredVisual ?? undefined}
                    sizes="(max-width: 760px) 100vw, 360px"
                  />
                ) : (
                  <div
                    className={styles.massifFallback}
                    role="img"
                    aria-label={`Illustration du massif ${featuredMassif.massif}`}
                  >
                    <Mountain aria-hidden="true" />
                  </div>
                )}
                <span className={styles.featuredMassifLabel}>
                  Massif en cours
                </span>
              </div>
              <div className={styles.featuredMassifContent}>
                <div>
                  <h3>{featuredMassif.massif}</h3>
                  <strong>{featuredMassif.progress}% exploré</strong>
                </div>
                <p>
                  {featuredMassif.discovered} sommet
                  {featuredMassif.discovered > 1 ? "s" : ""} sur{" "}
                  {featuredMassif.total} dans ton carnet.
                </p>
                <div
                  className={styles.featuredMassifTrack}
                  role="progressbar"
                  aria-label={`Progression du massif ${featuredMassif.massif}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={featuredMassif.progress}
                >
                  <span style={{ width: `${featuredMassif.progress}%` }} />
                </div>
                {featuredSummit ? (
                  <span className={styles.featuredNextSummit}>
                    Prochaine découverte : <b>{featuredSummit.name}</b>
                  </span>
                ) : null}
                <button
                  type="button"
                  className={styles.textAction}
                  onClick={() => onSelect(featuredMassif.massif)}
                >
                  Ouvrir le massif
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </article>
          ) : null}

          <div className={styles.massifGrid}>
            {otherMassifs.map((massif) => {
              const completed = massif.progress === 100;
              const started = massif.discovered > 0;

              return (
                <button
                  key={massif.massif}
                  type="button"
                  className={styles.massifCard}
                  data-state={
                    completed ? "completed" : started ? "started" : "empty"
                  }
                  onClick={() => onSelect(massif.massif)}
                  aria-label={`Voir les sommets du massif ${massif.massif}`}
                >
                  <span className={styles.massifIcon} aria-hidden="true">
                    {completed ? <Check /> : <Mountain />}
                  </span>
                  <span className={styles.massifCopy}>
                    <span>
                      <strong>{massif.massif}</strong>
                      <b>{massif.progress}%</b>
                    </span>
                    <small>
                      {completed
                        ? "Collection complétée"
                        : started
                          ? `${massif.discovered} sur ${massif.total} sommets`
                          : `${massif.total} sommets à révéler`}
                    </small>
                    <span className={styles.massifTrack}>
                      <i style={{ width: `${massif.progress}%` }} />
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export function NextDiscovery({
  summit,
  massifProgress,
}: {
  summit: SummitView | undefined;
  massifProgress: MassifProgress | undefined;
}) {
  if (!summit) {
    return null;
  }

  const remainingInMassif = massifProgress
    ? massifProgress.total - massifProgress.discovered
    : null;
  const reason =
    summit.closestDistance === null
      ? remainingInMassif
        ? `Encore ${remainingInMassif} sommet${
            remainingInMassif > 1 ? "s" : ""
          } pour compléter ${summit.massif}.`
        : `Une prochaine page à écrire dans le massif ${summit.massif}.`
      : `Une trace est déjà passée à ${formatSummitDistance(
          summit.closestDistance,
        )} à vol d’oiseau.`;

  return (
    <section className={styles.nextDiscovery}>
      <div className={styles.nextDiscoveryArtwork}>
        <SummitVisual summit={summit} sizes="(max-width: 760px) 100vw, 420px" />
        <span className={styles.nextDiscoveryVeil} aria-hidden="true" />
      </div>
      <div className={styles.nextDiscoveryContent}>
        <span className={styles.sectionLabel}>Prochaine découverte</span>
        <h2>{summit.name}</h2>
        <p className={styles.nextDiscoveryMeta}>
          {formatSummitAltitude(summit.altitude)} · {summit.massif}
        </p>
        <p>
          {reason} {summit.name} pourrait être ta prochaine page.
        </p>
        {massifProgress ? (
          <div
            className={styles.nextMassifProgress}
            role="progressbar"
            aria-label={`Collection ${summit.massif} : ${massifProgress.progress}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={massifProgress.progress}
          >
            <span>
              Collection {summit.massif} : {massifProgress.discovered}/
              {massifProgress.total}
            </span>
            <i>
              <b style={{ width: `${massifProgress.progress}%` }} />
            </i>
          </div>
        ) : null}
        <Link href={getSummitHref(summit)} className={styles.paperButton}>
          Voir le sommet
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
