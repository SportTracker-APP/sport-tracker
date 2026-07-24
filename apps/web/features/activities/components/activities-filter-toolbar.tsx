import type { ActivityFilter } from "../activities-types";
import { ACTIVITY_FILTERS } from "../activities-types";
import styles from "../activities.module.css";

export function ActivitiesFilterToolbar({
  activeFilter,
  resultCount,
  onChange,
}: {
  activeFilter: ActivityFilter;
  resultCount: number;
  onChange: (filter: ActivityFilter) => void;
}) {
  return (
    <section className={styles.toolbar} aria-label="Filtres du carnet">
      <div className={styles.filterScroller}>
        <div className={styles.filterList} role="group" aria-label="Sport">
          {ACTIVITY_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                className={styles.filterButton}
                data-active={isActive}
                aria-pressed={isActive}
                onClick={() => onChange(filter)}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        <strong>{resultCount}</strong>
        sortie{resultCount > 1 ? "s" : ""}
      </p>
    </section>
  );
}
