"use client";

import { ArrowRight, Check, Compass, Map, Mountain } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  useDiscoveryGeoOptions,
  useUpdateDiscoveryGeoPreferences,
} from "@/hooks/use-geo-preferences";
import { getMe } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

import styles from "./discovery-areas-onboarding.module.css";

export function DiscoveryAreasOnboarding() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const optionsQuery = useDiscoveryGeoOptions();
  const updatePreferences = useUpdateDiscoveryGeoPreferences();
  const [refineDepartmentId, setRefineDepartmentId] = useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const departments = optionsQuery.data ?? [];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  async function continueWith(geoAreaIds: string[]) {
    await updatePreferences.mutateAsync(geoAreaIds);
    setUser(await getMe());
    router.replace("/refuge");
  }

  function selectWholeDepartment(departmentId: string, massifIds: string[]) {
    setSelectedIds((current) => {
      const withoutDepartmentChildren = current.filter(
        (id) => id !== departmentId && !massifIds.includes(id),
      );
      return current.includes(departmentId)
        ? withoutDepartmentChildren
        : [...withoutDepartmentChildren, departmentId];
    });
  }

  function toggleMassif(departmentId: string, massifId: string) {
    setSelectedIds((current) =>
      current.includes(massifId)
        ? current.filter((id) => id !== massifId && id !== departmentId)
        : [...current.filter((id) => id !== departmentId), massifId],
    );
  }

  return (
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        <section className={styles.sheet} aria-labelledby="discovery-title">
          <header className={styles.header}>
            <p className={styles.kicker}>
              <Compass aria-hidden="true" />
              Ton terrain d’aventure
            </p>
            <h1 id="discovery-title">Où veux-tu explorer&nbsp;?</h1>
            <p>
              Choisis les territoires que tu veux voir en priorité. Tu pourras
              toujours explorer l’ensemble du catalogue HOVREN.
            </p>
          </header>

          {optionsQuery.isLoading ? (
            <div className={styles.state} role="status">
              <span />
              Lecture des territoires disponibles…
            </div>
          ) : optionsQuery.isError ? (
            <div className={styles.state} role="alert">
              <strong>Les territoires sont momentanément indisponibles.</strong>
              <button type="button" onClick={() => void optionsQuery.refetch()}>
                Réessayer
              </button>
            </div>
          ) : departments.length === 0 ? (
            <div className={styles.state}>
              Aucun catalogue territorial n’est encore disponible.
            </div>
          ) : (
            <div className={styles.content}>
              {departments.map((department) => (
                <div key={department.id} className={styles.departmentGroup}>
                  <button
                    type="button"
                    className={styles.departmentCard}
                    data-selected={selectedSet.has(department.id)}
                    aria-pressed={selectedSet.has(department.id)}
                    onClick={() =>
                      selectWholeDepartment(
                        department.id,
                        department.massifs.map(({ id }) => id),
                      )
                    }
                  >
                    <span className={styles.departmentIcon}>
                      <Map aria-hidden="true" />
                    </span>
                    <span>
                      <small>Catalogue disponible</small>
                      <strong>{department.name}</strong>
                      <em>
                        {department._count.summitLinks.toLocaleString("fr-FR")}{" "}
                        sommets
                      </em>
                    </span>
                    <span className={styles.choiceMark}>
                      {selectedSet.has(department.id) ? <Check /> : null}
                    </span>
                  </button>

                  {department.massifs.length > 0 ? (
                    <>
                      <div className={styles.refineHeading}>
                        <div>
                          <Mountain aria-hidden="true" />
                          <span>
                            <strong>Affiner par massif</strong>
                            <small>Tu peux en choisir plusieurs.</small>
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-expanded={refineDepartmentId === department.id}
                          onClick={() =>
                            setRefineDepartmentId((current) =>
                              current === department.id ? null : department.id,
                            )
                          }
                        >
                          {refineDepartmentId === department.id
                            ? "Masquer"
                            : "Affiner"}
                        </button>
                      </div>

                      {refineDepartmentId === department.id ? (
                        <div className={styles.massifGrid}>
                          {department.massifs.map((massif) => {
                            const selected = selectedSet.has(massif.id);
                            return (
                              <button
                                key={massif.id}
                                type="button"
                                data-selected={selected}
                                aria-pressed={selected}
                                onClick={() =>
                                  toggleMassif(department.id, massif.id)
                                }
                              >
                                <span className={styles.massifMark}>
                                  {selected ? <Check /> : null}
                                </span>
                                <span>
                                  <strong>{massif.name}</strong>
                                  <small>
                                    {massif._count.summitLinks.toLocaleString(
                                      "fr-FR",
                                    )}{" "}
                                    sommets
                                  </small>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ))}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.skip}
                  disabled={updatePreferences.isPending}
                  onClick={() => void continueWith([])}
                >
                  Explorer tout HOVREN
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={
                    selectedIds.length === 0 || updatePreferences.isPending
                  }
                  onClick={() => void continueWith(selectedIds)}
                >
                  {updatePreferences.isPending
                    ? "Enregistrement…"
                    : "Explorer ces territoires"}
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>

              {updatePreferences.isError ? (
                <p className={styles.error} role="alert">
                  Impossible d’enregistrer ce choix pour le moment.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
