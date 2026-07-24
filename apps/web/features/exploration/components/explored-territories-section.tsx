import {
  ArrowRight,
  CalendarDays,
  Flag,
  MapPinned,
  Mountain,
  Route,
} from "lucide-react";
import Link from "next/link";

import type { ExplorationTerritory } from "../exploration-types";
import {
  formatDate,
  formatDistance,
  formatInteger,
} from "../exploration-utils";
import styles from "../exploration.module.css";

type ExploredTerritoriesSectionProps = {
  territories: ExplorationTerritory[];
  activeTerritory: string | null;
  onSelect: (territory: string) => void;
};

export function ExploredTerritoriesSection({
  territories,
  activeTerritory,
  onSelect,
}: ExploredTerritoriesSectionProps) {
  return (
    <section
      className={styles.territorySection}
      aria-labelledby="territories-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <p>Territoires parcourus</p>
          <h2 id="territories-title">
            Les lieux où ton atlas a déjà pris racine.
          </h2>
        </div>
      </div>

      {territories.length > 0 ? (
        <div className={styles.territoryGrid}>
          {territories.map((territory, index) => (
            <button
              type="button"
              key={territory.name}
              className={
                activeTerritory === territory.name
                  ? styles.territoryActive
                  : undefined
              }
              onClick={() => onSelect(territory.name)}
              aria-pressed={activeTerritory === territory.name}
            >
              <span className={styles.territoryIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.territoryName}>
                <MapPinned aria-hidden="true" />
                <strong>{territory.name}</strong>
              </span>
              <span className={styles.territoryFacts}>
                <span>
                  <Route aria-hidden="true" />
                  {territory.routeCount} trace
                  {territory.routeCount > 1 ? "s" : ""}
                </span>
                <span>{formatDistance(territory.distance)} km</span>
                <span>
                  <Mountain aria-hidden="true" />
                  {formatInteger(territory.elevationGain)} m
                </span>
              </span>
              <span className={styles.territoryDate}>
                <CalendarDays aria-hidden="true" />
                Dernière visite : {formatDate(territory.lastVisitedAt, true)}
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.territoryEmpty}>
          <MapPinned aria-hidden="true" />
          <p>
            Les noms de territoire apparaîtront ici lorsque tes prochaines
            activités seront associées à une ville.
          </p>
        </div>
      )}

      <div className={styles.nextTerritory}>
        <div>
          <Flag aria-hidden="true" />
          <p>Prochaine zone à révéler</p>
          <h3>Choisis un sommet, puis dessine la suite.</h3>
          <span>
            Ton catalogue de sommets offre des idées réelles sans inventer une
            recommandation géographique.
          </span>
        </div>
        <Link href="/sommets">
          Ouvrir le carnet des sommets
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
