"use client";

import { Check, Map, Mountain } from "lucide-react";
import { useMemo, useState } from "react";

import {
  useDiscoveryGeoOptions,
  useGeoPreferences,
  useUpdateDiscoveryGeoPreferences,
} from "@/hooks/use-geo-preferences";

import styles from "./settings.module.css";

export function AdventureTerritoriesCard() {
  const optionsQuery = useDiscoveryGeoOptions();
  const preferencesQuery = useGeoPreferences();
  const updatePreferences = useUpdateDiscoveryGeoPreferences();
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const persistedIds = useMemo(
    () =>
      preferencesQuery.data?.discovery.map((preference) => preference.id) ??
      [],
    [preferencesQuery.data],
  );
  const selectedIds = draftIds ?? persistedIds;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (optionsQuery.isLoading || preferencesQuery.isLoading) {
    return (
      <div className={styles.territoryState}>Lecture de tes territoires…</div>
    );
  }

  if (optionsQuery.isError || preferencesQuery.isError) {
    return (
      <div className={styles.territoryState} role="alert">
        Impossible de charger tes territoires d’aventure.
      </div>
    );
  }

  return (
    <div className={styles.territoryContent}>
      <header className={styles.cardHeader}>
        <h2>Territoires d’aventure</h2>
        <p>
          Choisis les reliefs affichés en priorité. Le catalogue complet reste
          toujours accessible.
        </p>
      </header>

      <div className={styles.territoryChoices}>
        {optionsQuery.data?.map((department) => (
          <div key={department.id} className={styles.territoryGroup}>
            <button
              type="button"
              data-selected={selectedSet.has(department.id)}
              aria-pressed={selectedSet.has(department.id)}
              onClick={() =>
                setDraftIds(() => {
                  const massifIds = department.massifs.map(({ id }) => id);
                  const withoutDepartmentChildren = selectedIds.filter(
                    (id) => id !== department.id && !massifIds.includes(id),
                  );
                  return selectedIds.includes(department.id)
                    ? withoutDepartmentChildren
                    : [...withoutDepartmentChildren, department.id];
                })
              }
            >
              <Map aria-hidden="true" />
              <span>
                <strong>Toute la {department.name}</strong>
                <small>{department._count.summitLinks} sommets</small>
              </span>
              {selectedSet.has(department.id) ? <Check /> : null}
            </button>

            <p>
              <Mountain aria-hidden="true" />
              Ou affiner par massif
            </p>
            <div className={styles.territoryMassifs}>
              {department.massifs.map((massif) => {
                const selected = selectedSet.has(massif.id);
                return (
                  <button
                    key={massif.id}
                    type="button"
                    aria-pressed={selected}
                    data-selected={selected}
                    onClick={() => {
                      setDraftIds(() => {
                        const withoutDepartment = selectedIds.filter(
                          (id) => id !== department.id,
                        );
                        return withoutDepartment.includes(massif.id)
                          ? withoutDepartment.filter((id) => id !== massif.id)
                          : [...withoutDepartment, massif.id];
                      });
                    }}
                  >
                    <span>{selected ? <Check /> : null}</span>
                    {massif.name}
                    <small>{massif._count.summitLinks}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.territoryActions}>
        <button
          type="button"
          onClick={() => setDraftIds([])}
          disabled={updatePreferences.isPending}
        >
          Tout HOVREN
        </button>
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            updatePreferences.mutate(selectedIds, {
              onSuccess: () =>
                setFeedback("Tes territoires ont été mis à jour."),
            });
          }}
          disabled={updatePreferences.isPending}
        >
          {updatePreferences.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {feedback ? (
        <p className={styles.feedbackSuccess} role="status">
          {feedback}
        </p>
      ) : null}
      {updatePreferences.isError ? (
        <p className={styles.feedbackError} role="alert">
          Impossible d’enregistrer tes territoires.
        </p>
      ) : null}
    </div>
  );
}
