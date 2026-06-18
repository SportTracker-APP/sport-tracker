import Link from "next/link";
import { Link2 } from "lucide-react";

import styles from "../dashboard.module.css";

export function DashboardSyncBanner() {
  return (
    <div className={styles.syncBanner}>
      <span>
        Votre dashboard utilise vos activités manuelles. Connectez Strava pour
        automatiser les tendances et recommandations.
      </span>
      <Link href="/integrations/strava">
        <Link2 aria-hidden="true" /> Connecter Strava
      </Link>
    </div>
  );
}
