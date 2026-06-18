import Link from "next/link";
import { Link2, Plus } from "lucide-react";

import styles from "../dashboard.module.css";

export function EmptyStravaDashboard() {
  return (
    <div className={styles.emptyDashboard}>
      <div className={styles.emptyDashboardIcon}>
        <Link2 aria-hidden="true" />
      </div>
      <p className={styles.emptyDashboardKicker}>Strava non synchronisé</p>
      <h1>
        Connectez Strava et transformez vos sorties en carnet d’exploration.
      </h1>
      <p>
        Course au bord du lac, trail dans les Aravis ou boucle du soir : Montaro
        transforme votre historique en tendances, objectifs et prochaines
        aventures.
      </p>
      <div className={styles.emptyDashboardActions}>
        <Link href="/integrations/strava" className={styles.primaryButton}>
          <Link2 aria-hidden="true" /> Connecter Strava
        </Link>
        <Link href="/activites/nouvelle" className={styles.secondaryButton}>
          <Plus aria-hidden="true" /> Ajouter une activité
        </Link>
      </div>
    </div>
  );
}
