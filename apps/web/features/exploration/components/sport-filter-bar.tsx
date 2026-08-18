import {
  Bike,
  Footprints,
  Mountain,
  MapPin,
  Sparkles,
  Trees,
} from "lucide-react";

import type { ExplorationFilter } from "../exploration-types";
import {
  SummitScopeSwitch,
  type SummitCatalogScope,
} from "@/components/summits/summit-scope-switch";
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
  summitsVisible: boolean;
  summitsLoading: boolean;
  summitsError: boolean;
  summitCount: number;
  onToggleSummits: () => void;
  onRetrySummits?: () => void;
  summitScope?: SummitCatalogScope;
  hasPreferredGeoAreas?: boolean;
  onSummitScopeChange?: (scope: SummitCatalogScope) => void;
};

export function SportFilterBar({
  activeFilter,
  visibleCount,
  territory,
  onChange,
  onClearTerritory,
  summitsVisible,
  summitsLoading,
  summitsError,
  summitCount,
  onToggleSummits,
  onRetrySummits,
  summitScope = "ALL",
  hasPreferredGeoAreas = false,
  onSummitScopeChange,
}: SportFilterBarProps) {
  return (
    <>
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
        <div className={styles.filterMeta}>
          {onSummitScopeChange ? (
            <SummitScopeSwitch
              value={summitScope}
              disabled={!hasPreferredGeoAreas}
              onChange={onSummitScopeChange}
            />
          ) : null}
          <button
            type="button"
            className={`${styles.summitToggle} ${summitsVisible ? styles.summitToggleActive : ""}`}
            aria-pressed={summitsVisible}
            aria-busy={summitsLoading}
            onClick={onToggleSummits}
          >
            <MapPin aria-hidden="true" />
            Sommets
            {summitsLoading ? (
              <span className="sr-only"> en chargement</span>
            ) : null}
          </button>
          <div className={styles.visibleCount} aria-live="polite">
            <strong>{visibleCount}</strong> trace{visibleCount > 1 ? "s" : ""}{" "}
            visible{visibleCount > 1 ? "s" : ""}
            {territory ? (
              <button type="button" onClick={onClearTerritory}>
                {territory} ×
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {summitsError ? (
        <div className={styles.summitLayerNotice} role="status">
          <span>
            La couche Sommets est indisponible. Tes traces restent affichées.
          </span>
          {onRetrySummits ? (
            <button type="button" onClick={onRetrySummits}>
              Réessayer
            </button>
          ) : null}
        </div>
      ) : !summitsLoading && summitCount === 0 ? (
        <div className={styles.summitLayerNotice} role="status">
          Aucun sommet publié à afficher pour le moment.
        </div>
      ) : null}
    </>
  );
}
