import { ArrowDown, CheckCircle2, Mountain } from "lucide-react";

import type { SummitCollectionSummary } from "../summits-types";
import styles from "../summits.module.css";
import { SummitsAtlasIllustration } from "./summits-atlas-illustration";

type SummitsHeaderProps = {
  summary: SummitCollectionSummary;
  onExplore: () => void;
  onReviewPending: () => void;
};

export function SummitsHeader({
  summary,
  onExplore,
  onReviewPending,
}: SummitsHeaderProps) {
  const explorationLabel =
    summary.missingCount > 0
      ? `Découvrir les ${summary.missingCount} sommets restants`
      : "Feuilleter mon carnet";

  return (
    <header className={styles.editorialHeader}>
      <div className={styles.headerCopy}>
        <span className={styles.eyebrow}>
          <Mountain aria-hidden="true" />
          Carnet des sommets
        </span>
        <h1>Ton carnet des sommets</h1>
        <p>Chaque sommet découvert devient une page de ton histoire.</p>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={onExplore}
          >
            <ArrowDown aria-hidden="true" />
            {explorationLabel}
          </button>
          {summary.pendingCount > 0 ? (
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={onReviewPending}
            >
              <CheckCircle2 aria-hidden="true" />
              Confirmer une découverte
              <span>{summary.pendingCount}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.headerArtwork}>
        <SummitsAtlasIllustration summary={summary} />
      </div>
    </header>
  );
}
