import { MapPinned } from "lucide-react";

import {
  formatDistance,
  formatInteger,
} from "../exploration-utils";
import styles from "../exploration.module.css";

type ExplorationHeaderProps = {
  distance: number;
  routeCount: number;
};

export function ExplorationHeader({
  distance,
  routeCount,
}: ExplorationHeaderProps) {
  const hasRoutes = routeCount > 0;
  const traceLabel = routeCount === 1 ? "trace" : "traces";
  const verb = routeCount === 1 ? "a dessiné" : "ont dessiné";

  return (
    <header className={styles.header}>
      <div className={styles.headerCopy}>
        <p className={styles.eyebrow}>
          <MapPinned aria-hidden="true" />
          Atlas outdoor
        </p>
        <h1>Ton territoire prend forme.</h1>
        <p className={styles.headerLead}>
          Chaque sortie dessine une nouvelle ligne sur ta carte personnelle.
        </p>
      </div>

      <div
        className={styles.headerReading}
        aria-label={
          hasRoutes
            ? `${formatInteger(routeCount)} ${traceLabel} ${verb} ${formatDistance(distance)} kilomètres de territoire`
            : "Ton territoire attend sa première trace"
        }
      >
        {hasRoutes ? (
          <p>
            <strong>
              {formatInteger(routeCount)} {traceLabel}
            </strong>
            <span>{verb}</span>
            <strong>{formatDistance(distance)} km</strong>
            <span>de territoire</span>
          </p>
        ) : (
          <p className={styles.headerReadingEmpty}>
            Ton territoire attend sa première trace.
          </p>
        )}
        <span className={styles.headerReadingRule} aria-hidden="true" />
      </div>

      <svg
        className={styles.headerTopography}
        viewBox="0 0 720 190"
        aria-hidden="true"
      >
        <path d="M58 155c35-61 95-91 161-66 41 16 60 58 110 46 56-14 59-88 132-91 62-2 80 52 140 51 35-1 58-19 83-47" />
        <path d="M24 175c43-83 118-126 205-94 58 21 69 76 129 57 72-23 80-112 172-107 74 4 93 67 168 51" />
        <path d="M128 186c24-51 68-76 113-59 32 11 39 41 71 32 43-11 53-70 102-73 42-2 58 37 97 38" />
        <circle cx="461" cy="44" r="4" />
        <circle cx="219" cy="89" r="3" />
        <path className={styles.headerRoute} d="M219 89c61 18 58 65 110 46 49-18 64-65 132-91" />
      </svg>
    </header>
  );
}
