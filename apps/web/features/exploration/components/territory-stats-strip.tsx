import { MapPinned, Mountain, Route } from "lucide-react";

import {
  formatDistance,
  formatInteger,
} from "../exploration-utils";
import styles from "../exploration.module.css";

type TerritoryStatsStripProps = {
  distance: number;
  elevation: number;
  departureCount: number;
};

export function TerritoryStatsStrip({
  distance,
  elevation,
  departureCount,
}: TerritoryStatsStripProps) {
  const stats = [
    {
      icon: Route,
      value: `${formatDistance(distance)} km`,
      label: "parcourus",
    },
    {
      icon: Mountain,
      value: `${formatInteger(elevation)} m`,
      label: "de dénivelé",
    },
    {
      icon: MapPinned,
      value: formatInteger(departureCount),
      label: "départs détectés",
    },
  ];

  return (
    <div className={styles.statsStrip} aria-label="Lecture du territoire filtré">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label}>
            <Icon aria-hidden="true" />
            <p>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
