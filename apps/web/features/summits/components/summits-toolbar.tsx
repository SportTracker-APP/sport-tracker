"use client";

import {
  ChevronDown,
  Grid2X2,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useId, useState } from "react";

import type { SummitFilterState, SummitStatusFilter } from "../summits-types";
import styles from "../summits.module.css";

type SummitsToolbarProps = {
  filters: SummitFilterState;
  counts: {
    discovered: number;
    pending: number;
    missing: number;
    all: number;
  };
  resultCount: number;
  massifOptions: string[];
  difficultyOptions: string[];
  hasActiveFilters: boolean;
  onChange: (nextFilters: SummitFilterState) => void;
  onReset: () => void;
};

const statusTabs: Array<{
  value: SummitStatusFilter;
  label: string;
  countKey: keyof SummitsToolbarProps["counts"];
}> = [
  { value: "DISCOVERED", label: "Découverts", countKey: "discovered" },
  { value: "PENDING", label: "À confirmer", countKey: "pending" },
  { value: "MISSING", label: "À découvrir", countKey: "missing" },
  { value: "ALL", label: "Tous", countKey: "all" },
];

const altitudeLabels: Record<SummitFilterState["altitude"], string> = {
  ALL: "Toutes les altitudes",
  LOW: "Moins de 1 500 m",
  MID: "1 500 à 2 199 m",
  HIGH: "2 200 à 2 999 m",
  ALPINE: "3 000 m et plus",
};

export function SummitsToolbar({
  filters,
  counts,
  resultCount,
  massifOptions,
  difficultyOptions,
  hasActiveFilters,
  onChange,
  onReset,
}: SummitsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterPanelId = useId();
  const update = <Key extends keyof SummitFilterState>(
    key: Key,
    value: SummitFilterState[Key],
  ) => onChange({ ...filters, [key]: value });
  const advancedFilterCount = [
    filters.massif !== "ALL",
    filters.difficulty !== "ALL",
    filters.altitude !== "ALL",
  ].filter(Boolean).length;
  const activeChips = [
    filters.massif !== "ALL"
      ? {
          key: "massif",
          label: filters.massif,
          clear: () => update("massif", "ALL"),
        }
      : null,
    filters.difficulty !== "ALL"
      ? {
          key: "difficulty",
          label: filters.difficulty,
          clear: () => update("difficulty", "ALL"),
        }
      : null,
    filters.altitude !== "ALL"
      ? {
          key: "altitude",
          label: altitudeLabels[filters.altitude],
          clear: () => update("altitude", "ALL"),
        }
      : null,
  ].filter(
    (
      chip,
    ): chip is {
      key: string;
      label: string;
      clear: () => void;
    } => chip !== null,
  );

  return (
    <section className={styles.toolbar} aria-labelledby="summit-catalog-title">
      <div className={styles.catalogHeading}>
        <div>
          <span className={styles.sectionLabel}>Carnet à feuilleter</span>
          <h2 id="summit-catalog-title">Tous tes sommets</h2>
        </div>
        <span className={styles.resultCount}>
          {resultCount} sommet{resultCount > 1 ? "s" : ""} affiché
          {resultCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className={styles.toolbarTop}>
        <div
          className={styles.statusTabs}
          role="group"
          aria-label="Filtrer les sommets par statut"
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={filters.status === tab.value}
              onClick={() =>
                onChange({
                  ...filters,
                  status: tab.value,
                  viewMode:
                    tab.value === "PENDING" ? "CARDS" : filters.viewMode,
                })
              }
            >
              {tab.label}
              <span>{counts[tab.countKey]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterBar}>
        <label className={styles.searchField}>
          <span className={styles.srOnly}>Rechercher un sommet</span>
          <Search aria-hidden="true" />
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(event) => update("searchQuery", event.target.value)}
            placeholder="Rechercher un sommet"
          />
          {filters.searchQuery ? (
            <button
              type="button"
              onClick={() => update("searchQuery", "")}
              aria-label="Effacer la recherche"
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </label>

        <button
          type="button"
          className={styles.filtersButton}
          aria-expanded={filtersOpen}
          aria-controls={filterPanelId}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filtres
          {advancedFilterCount > 0 ? <span>{advancedFilterCount}</span> : null}
          <ChevronDown aria-hidden="true" />
        </button>

        <label className={styles.sortField}>
          <span className={styles.srOnly}>Trier les sommets</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              update("sort", event.target.value as SummitFilterState["sort"])
            }
          >
            <option value="DISCOVERY">Dernière découverte</option>
            <option value="ALTITUDE_DESC">Altitude décroissante</option>
            <option value="ALTITUDE_ASC">Altitude croissante</option>
            <option value="NAME">Nom</option>
            <option value="PASSES">Nombre de passages</option>
          </select>
        </label>

        <div
          className={styles.viewSwitch}
          role="group"
          aria-label="Changer la présentation"
        >
          <button
            type="button"
            aria-pressed={filters.viewMode === "CARDS"}
            onClick={() => update("viewMode", "CARDS")}
            aria-label="Afficher la grille"
            title="Grille"
          >
            <Grid2X2 aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-pressed={filters.viewMode === "TABLE"}
            onClick={() => update("viewMode", "TABLE")}
            aria-label="Afficher la liste"
            title="Liste"
          >
            <List aria-hidden="true" />
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div
          id={filterPanelId}
          className={styles.advancedFilters}
          aria-label="Filtres avancés"
        >
          <label>
            <span>Massif</span>
            <select
              value={filters.massif}
              onChange={(event) => update("massif", event.target.value)}
            >
              <option value="ALL">Tous les massifs</option>
              {massifOptions.map((massif) => (
                <option key={massif} value={massif}>
                  {massif}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Difficulté</span>
            <select
              value={filters.difficulty}
              onChange={(event) => update("difficulty", event.target.value)}
            >
              <option value="ALL">Toutes</option>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Altitude</span>
            <select
              value={filters.altitude}
              onChange={(event) =>
                update(
                  "altitude",
                  event.target.value as SummitFilterState["altitude"],
                )
              }
            >
              {Object.entries(altitudeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              className={styles.resetButton}
              onClick={onReset}
            >
              <RotateCcw aria-hidden="true" />
              Réinitialiser
            </button>
          ) : null}
        </div>
      ) : null}

      {activeChips.length > 0 ? (
        <div className={styles.activeFilters} aria-label="Filtres actifs">
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.clear}>
              {chip.label}
              <X aria-hidden="true" />
              <span className={styles.srOnly}>Supprimer ce filtre</span>
            </button>
          ))}
          <button
            type="button"
            className={styles.clearFilters}
            onClick={onReset}
          >
            Tout effacer
          </button>
        </div>
      ) : null}
    </section>
  );
}
