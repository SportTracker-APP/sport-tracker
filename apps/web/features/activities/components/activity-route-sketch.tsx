import { useId, useMemo } from "react";

import { createRouteSketch } from "../activities-utils";
import styles from "../activities.module.css";

function createPath(points: Array<{ x: number; y: number }>) {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

export function ActivityRouteSketch({
  polyline,
  compact = false,
}: {
  polyline: string;
  compact?: boolean;
}) {
  const routePoints = useMemo(() => createRouteSketch(polyline), [polyline]);
  const routePath = useMemo(() => createPath(routePoints), [routePoints]);
  const rawId = useId();
  const patternId = `activity-grid-${rawId.replaceAll(":", "")}`;
  const start = routePoints[0];
  const end = routePoints.at(-1);

  if (!start || !end || !routePath) {
    return null;
  }

  return (
    <svg
      className={styles.routeSketch}
      data-compact={compact}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Aperçu de la trace GPS"
    >
      <defs>
        <pattern
          id={patternId}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.3" fill="currentColor" />
        </pattern>
      </defs>
      <rect
        width="100"
        height="100"
        fill={`url(#${patternId})`}
        className={styles.routePaperGrid}
      />
      <path
        d="M-4 88 22 63 39 76 62 45 78 62 104 32v72H-4Z"
        className={styles.routeMountainBack}
      />
      <path
        d="M-4 98 19 77 35 88 57 59 74 80 90 62l14 13v29H-4Z"
        className={styles.routeMountainFront}
      />
      <path d={routePath} className={styles.routeHalo} />
      <path d={routePath} className={styles.routeInk} />
      <circle
        cx={start.x}
        cy={start.y}
        r={compact ? 2.4 : 2}
        className={styles.routeStart}
      />
      <circle
        cx={end.x}
        cy={end.y}
        r={compact ? 2.6 : 2.3}
        className={styles.routeEnd}
      />
    </svg>
  );
}
