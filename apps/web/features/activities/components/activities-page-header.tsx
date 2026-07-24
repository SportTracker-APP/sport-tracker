import Link from "next/link";
import { Plus } from "lucide-react";

import type { YearlyJournalSummary } from "../activities-types";
import styles from "../activities.module.css";

function HeaderTopography() {
  return (
    <svg
      className={styles.headerTopography}
      viewBox="0 0 640 210"
      aria-hidden="true"
      fill="none"
    >
      <path d="M36 176c54-72 107-78 158-35s102 30 142-27 91-65 158-17 89 31 117-6" />
      <path d="M21 153c60-88 121-91 178-43s104 31 148-35 105-67 164-19 82 31 111 3" />
      <path d="M3 128c68-104 138-106 202-51s111 32 161-43 121-70 176-20 71 28 96 7" />
      <path
        className={styles.headerRoute}
        d="M75 169c49-16 72-43 106-48 42-6 56 42 103 27 43-13 40-66 82-75 39-8 57 32 91 31"
      />
      <circle cx="75" cy="169" r="3.5" />
      <circle cx="284" cy="148" r="3.5" />
      <circle className={styles.headerLastPoint} cx="457" cy="104" r="5" />
    </svg>
  );
}

export function ActivitiesPageHeader({
  totalCount,
  summary,
  isLoading = false,
}: {
  totalCount: number;
  summary: YearlyJournalSummary;
  isLoading?: boolean;
}) {
  return (
    <header className={styles.header}>
      <HeaderTopography />

      <div className={styles.headerCopy}>
        <p className={styles.eyebrow}>
          <span aria-hidden="true" /> Carnet de terrain
        </p>
        <h1>Tes sorties racontent ton chemin.</h1>
        <p className={styles.headerLead}>
          Des premières foulées aux grandes traversées, retrouve chaque aventure
          et les traces qu’elle a laissées.
        </p>

        <Link href="/activites/nouvelle" className={styles.createButton}>
          <Plus aria-hidden="true" />
          Nouvelle sortie
        </Link>
      </div>

      <div className={styles.headerReading}>
        <p>
          <strong>{isLoading ? "—" : totalCount}</strong>
          <span>sorties ont déjà rempli ton carnet</span>
        </p>
        <span className={styles.headerReadingRule} aria-hidden="true" />
        <div>
          <span>
            <strong>{isLoading ? "—" : summary.distanceLabel}</strong>
            parcourus en {summary.year}
          </span>
          <span>
            <strong>{isLoading ? "—" : summary.durationLabel}</strong>
            dehors
          </span>
        </div>
      </div>
    </header>
  );
}
