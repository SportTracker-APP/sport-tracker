import { AlertTriangle, Compass, Link2, MapPinned, RefreshCw } from "lucide-react";
import Link from "next/link";

import styles from "../exploration.module.css";

export function ExplorationSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Chargement de l’atlas" aria-busy="true">
      <div className={styles.skeletonHeader}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.skeletonToolbar} />
      <div className={styles.skeletonMap}>
        <Compass aria-hidden="true" />
      </div>
    </div>
  );
}

export function ExplorationError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className={styles.pageError} role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <p>L’atlas n’a pas reçu tes traces.</p>
        <span>
          La carte reste intacte. Réessaie simplement de charger tes activités.
        </span>
      </div>
      <button type="button" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}

export function ExplorationEmpty() {
  return (
    <section className={styles.emptyState}>
      <div className={styles.emptyIllustration}>
        <svg viewBox="0 0 560 260" aria-hidden="true">
          <path d="M-10 251 98 159l61 53 95-140 75 105 60-72 181 146H-10Z" />
          <path d="M40 228c63-18 96-72 154-70 55 2 69 65 126 49 50-14 73-64 140-58" />
          <circle cx="194" cy="158" r="6" />
        </svg>
      </div>
      <div>
        <p>Première page de l’atlas</p>
        <h2>Ton territoire attend sa première trace.</h2>
        <span>
          Synchronise Strava ou ajoute une activité avec un parcours pour
          révéler le relief que tu connais déjà.
        </span>
        <div>
          <Link href="/parametres">
            <Link2 aria-hidden="true" />
            Connecter Strava
          </Link>
          <Link href="/activites/nouvelle">
            <MapPinned aria-hidden="true" />
            Ajouter une sortie
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ExplorationNoResults({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className={styles.noResults} role="status">
      <Compass aria-hidden="true" />
      <div>
        <strong>Aucune trace dans ce pli de carte.</strong>
        <p>Change de sport ou enlève le filtre de territoire.</p>
      </div>
      <button type="button" onClick={onReset}>
        Voir toutes les traces
      </button>
    </div>
  );
}
