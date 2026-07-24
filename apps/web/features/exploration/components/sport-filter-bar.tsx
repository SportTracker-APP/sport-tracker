import {
  Bike,
  Footprints,
  Mountain,
  Sparkles,
  Trees,
} from "lucide-react";

import type { ExplorationFilter } from "../exploration-types";
import styles from "../exploration.module.css";

const FILTERS = [
  { label: "Toutes", value: "ALL", icon: Sparkles },
  { label: "Course", value: "RUNNING", icon: Footprints },
  { label: "Trail", value: "TRAIL", icon: Mountain },
  { label: "Randonnée", value: "HIKING", icon: Trees },
  { label: "Vélo", value: "BIKE", icon: Bike },
] satisfies Array<{
  label: string;
  value: ExplorationFilter;
  icon: typeof Sparkles;
}>;

type SportFilterBarProps = {
  activeFilter: ExplorationFilter;
  visibleCount: number;
  territory: string | null;
  onChange: (filter: ExplorationFilter) => void;
  onClearTerritory: () => void;
};

export function SportFilterBar({
  activeFilter,
  visibleCount,
  territory,
  onChange,
  onClearTerritory,
}: SportFilterBarProps) {
  return (
    <div className={styles.filterToolbar}>
      <div
        className={styles.filterScroller}
        role="toolbar"
        aria-label="Filtrer les traces par sport"
      >
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          const active = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              className={active ? styles.filterActive : undefined}
              aria-pressed={active}
              onClick={() => onChange(filter.value)}
            >
              <Icon aria-hidden="true" />
              {filter.label}
            </button>
          );
        })}
      </div>
      <div className={styles.visibleCount} aria-live="polite">
        <strong>{visibleCount}</strong> trace{visibleCount > 1 ? "s" : ""} visible
        {visibleCount > 1 ? "s" : ""}
        {territory ? (
          <button type="button" onClick={onClearTerritory}>
            {territory} ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
