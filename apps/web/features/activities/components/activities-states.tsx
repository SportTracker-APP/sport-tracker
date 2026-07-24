import { AlertTriangle, Plus, RefreshCw, Route } from "lucide-react";
import Link from "next/link";

import styles from "../activities.module.css";

export function ActivitiesSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Chargement des sorties">
      <span />
      <span />
      <span />
    </div>
  );
}

export function ActivitiesError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={styles.state}>
      <AlertTriangle aria-hidden="true" />
      <h2>Le carnet ne s’ouvre pas pour le moment.</h2>
      <p>Réessaie dans un instant pour retrouver tes sorties.</p>
      <button type="button" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Réessayer
      </button>
    </section>
  );
}

export function ActivitiesEmpty() {
  return (
    <section className={styles.state}>
      <Route aria-hidden="true" />
      <h2>Ta première page reste à écrire.</h2>
      <p>
        Ajoute une sortie ou synchronise Strava pour faire apparaître tes
        premières traces.
      </p>
      <Link href="/activites/nouvelle">
        <Plus aria-hidden="true" />
        Nouvelle sortie
      </Link>
    </section>
  );
}

export function ActivitiesFilterEmpty({
  filter,
  onReset,
}: {
  filter: string;
  onReset: () => void;
}) {
  return (
    <section className={styles.state}>
      <Route aria-hidden="true" />
      <h2>Aucune sortie de {filter.toLocaleLowerCase("fr-FR")}.</h2>
      <p>Le reste de ton carnet garde peut-être la trace que tu cherches.</p>
      <button type="button" onClick={onReset}>
        Voir toutes mes sorties
      </button>
    </section>
  );
}
