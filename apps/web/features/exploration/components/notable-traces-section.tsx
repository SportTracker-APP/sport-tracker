import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Mountain,
  Route,
} from "lucide-react";
import Link from "next/link";

import type { NotableRoute } from "../exploration-types";
import {
  formatDate,
  formatDistance,
  formatInteger,
  getSportLabel,
} from "../exploration-utils";
import styles from "../exploration.module.css";
import { RoutePhoto } from "./route-photo";

type NotableTracesSectionProps = {
  routes: NotableRoute[];
  selectedRouteId: string | null;
  onSelect: (routeId: string) => void;
};

export function NotableTracesSection({
  routes,
  selectedRouteId,
  onSelect,
}: NotableTracesSectionProps) {
  if (routes.length === 0) return null;

  return (
    <section
      className={styles.editorialSection}
      aria-labelledby="notable-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <p>Traces marquantes</p>
          <h2 id="notable-title">
            Les lignes qui ont le plus façonné ton territoire.
          </h2>
        </div>
        <Link href="/activites">
          Toutes mes sorties
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.notableGrid}>
        {routes.map(({ route, distinction }, index) => {
          const className = [
            index === 0 ? styles.notableFeatured : "",
            selectedRouteId === route.id ? styles.notableSelected : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={route.id} className={className || undefined}>
              <button
                type="button"
                className={styles.notableSelect}
                onClick={() => onSelect(route.id)}
                aria-label={`Afficher ${route.title} sur la carte`}
              >
                <span className={styles.notablePhoto}>
                  <RoutePhoto
                    src={route.coverImageUrl}
                    alt={`Aperçu de ${route.title}`}
                  />
                </span>
                <span className={styles.notableContent}>
                  <small>{distinction}</small>
                  <strong>{route.title}</strong>
                  <span className={styles.notableMeta}>
                    <span>
                      <Route aria-hidden="true" />
                      {getSportLabel(route.sport)}
                    </span>
                    <span>
                      <MapPin aria-hidden="true" />
                      {route.city || "Zone libre"}
                    </span>
                    <span>
                      <CalendarDays aria-hidden="true" />
                      {formatDate(route.startedAt, true)}
                    </span>
                  </span>
                  <span className={styles.notableNumbers}>
                    <b>{formatDistance(route.distance)} km</b>
                    <b>
                      <Mountain aria-hidden="true" />
                      {formatInteger(route.elevationGain)} m D+
                    </b>
                  </span>
                </span>
              </button>
              <Link
                href={`/activites/${route.id}`}
                aria-label={`Ouvrir la sortie ${route.title}`}
                title="Voir la sortie"
              >
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
