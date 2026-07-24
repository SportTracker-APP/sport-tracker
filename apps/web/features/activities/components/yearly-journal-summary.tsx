import {
  CalendarRange,
  Flame,
  Mountain,
  Route,
  Timer,
  Trophy,
} from "lucide-react";

import type { YearlyJournalSummary } from "../activities-types";
import styles from "../activities.module.css";

export function YearlyJournalSummary({
  summary,
}: {
  summary: YearlyJournalSummary;
}) {
  return (
    <aside className={styles.yearSummary} aria-labelledby="year-summary-title">
      <div className={styles.yearSummaryHeading}>
        <span>
          <CalendarRange aria-hidden="true" />
        </span>
        <div>
          <p>Bilan du carnet</p>
          <h2 id="year-summary-title">{summary.year}</h2>
        </div>
      </div>

      <p className={styles.yearSummaryLead}>
        Une année dehors, racontée en quelques repères.
      </p>

      <dl className={styles.yearStats}>
        <div>
          <dt>
            <Route aria-hidden="true" /> Sorties
          </dt>
          <dd>{summary.activityCount}</dd>
        </div>
        <div>
          <dt>
            <Route aria-hidden="true" /> Distance
          </dt>
          <dd>{summary.distanceLabel}</dd>
        </div>
        <div>
          <dt>
            <Timer aria-hidden="true" /> Temps dehors
          </dt>
          <dd>{summary.durationLabel}</dd>
        </div>
        {summary.elevationLabel ? (
          <div>
            <dt>
              <Mountain aria-hidden="true" /> Dénivelé
            </dt>
            <dd>{summary.elevationLabel}</dd>
          </div>
        ) : null}
        {summary.caloriesLabel ? (
          <div>
            <dt>
              <Flame aria-hidden="true" /> Énergie
            </dt>
            <dd>{summary.caloriesLabel} kcal</dd>
          </div>
        ) : null}
      </dl>

      {summary.favoriteSportLabel ? (
        <p className={styles.favoriteSport}>
          <Trophy aria-hidden="true" />
          <span>
            Terrain favori
            <strong>{summary.favoriteSportLabel}</strong>
          </span>
        </p>
      ) : null}

      <svg className={styles.summaryMountains} viewBox="0 0 320 96" aria-hidden>
        <path d="M-10 96 42 42l31 31 46-59 51 61 39-45 35 41 31-32 55 57Z" />
        <path d="M-10 96 58 65l28 21 44-43 39 37 35-24 47 32 36-23 43 31Z" />
      </svg>
    </aside>
  );
}
