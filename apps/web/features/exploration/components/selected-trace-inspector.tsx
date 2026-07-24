import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Mountain,
  Route,
  Timer,
  X,
} from "lucide-react";
import Link from "next/link";

import type { ExplorationRoute } from "../exploration-types";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatInteger,
  getSportLabel,
} from "../exploration-utils";
import styles from "../exploration.module.css";
import { RoutePhoto } from "./route-photo";

type SelectedTraceInspectorProps = {
  route: ExplorationRoute | null;
  onClose: () => void;
};

export function SelectedTraceInspector({
  route,
  onClose,
}: SelectedTraceInspectorProps) {
  if (!route) {
    return (
      <aside
        className={`${styles.inspector} ${styles.inspectorEmptyState}`}
        aria-label="Inspecteur de trace"
      >
        <div className={styles.inspectorEmpty}>
          <svg viewBox="0 0 320 190" aria-hidden="true">
            <path d="M30 150c36-14 47-64 86-66 40-2 51 44 89 34 27-7 37-42 73-47" />
            <path d="M9 174c49-24 66-99 119-101 54-2 71 60 121 40 29-12 39-49 70-62" />
            <circle cx="116" cy="84" r="5" />
            <circle cx="205" cy="118" r="4" />
          </svg>
          <p className={styles.inspectorLabel}>Inspecteur de trace</p>
          <h2>Sélectionne une trace sur la carte.</h2>
          <p>
            Tu retrouveras ici la date, le relief et les repères de cette
            aventure, sans quitter ton atlas.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`${styles.inspector} ${styles.inspectorSelected}`}
      aria-label={`Trace sélectionnée : ${route.title}`}
    >
      <div className={styles.inspectorPhoto}>
        <RoutePhoto
          src={route.coverImageUrl}
          alt={`Photographie de la sortie ${route.title}`}
          priority
        />
        <button
          type="button"
          className={styles.inspectorClose}
          onClick={onClose}
          aria-label="Fermer la trace sélectionnée"
          title="Fermer"
        >
          <X aria-hidden="true" />
        </button>
        <span className={styles.inspectorSport}>
          {getSportLabel(route.sport)}
        </span>
      </div>

      <div className={styles.inspectorBody}>
        <p className={styles.inspectorLabel}>Trace sélectionnée</p>
        <h2>{route.title}</h2>
        <div className={styles.inspectorDate}>
          <CalendarDays aria-hidden="true" />
          {formatDate(route.startedAt)}
        </div>

        <dl className={styles.inspectorMetrics}>
          <div>
            <Route aria-hidden="true" />
            <dt>Distance</dt>
            <dd>{formatDistance(route.distance)} km</dd>
          </div>
          <div>
            <Timer aria-hidden="true" />
            <dt>Durée</dt>
            <dd>{formatDuration(route.duration)}</dd>
          </div>
          <div>
            <Mountain aria-hidden="true" />
            <dt>Dénivelé</dt>
            <dd>{formatInteger(route.elevationGain)} m</dd>
          </div>
        </dl>

        <div className={styles.inspectorTerritory}>
          <MapPin aria-hidden="true" />
          <div>
            <span>Territoire traversé</span>
            <strong>{route.city || "Zone non renseignée"}</strong>
          </div>
        </div>

        <Link href={`/activites/${route.id}`} className={styles.primaryLink}>
          Voir la sortie
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
