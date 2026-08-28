"use client";

import { MapPinned, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  useAddAdminSummitGeoArea,
  useAdminGeoAreaOptions,
  useRemoveAdminSummitGeoArea,
  useUpdateAdminSummitPrimaryMassif,
} from "@/hooks/use-admin-summits";
import type { AdminSummitDetail } from "@/lib/admin-summits";
import { getApiErrorMessage } from "../admin-summit-utils";
import styles from "../admin-summits.module.css";
import { useDebouncedValue } from "../use-debounced-value";

type SummitGeoAreasSectionProps = {
  summit: AdminSummitDetail;
  onFeedback: (message: string, tone: "success" | "error") => void;
};

export function SummitGeoAreasSection({
  summit,
  onFeedback,
}: SummitGeoAreasSectionProps) {
  const [search, setSearch] = useState("");
  const [selectedGeoAreaId, setSelectedGeoAreaId] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const optionsQuery = useAdminGeoAreaOptions(debouncedSearch);
  const massifsQuery = useAdminGeoAreaOptions("", "MASSIF");
  const addMutation = useAddAdminSummitGeoArea(summit.id);
  const removeMutation = useRemoveAdminSummitGeoArea(summit.id);
  const primaryMassifMutation = useUpdateAdminSummitPrimaryMassif(summit.id);
  const linkedIds = useMemo(
    () => new Set(summit.geoAreas.map((area) => area.id)),
    [summit.geoAreas],
  );
  const availableOptions = (optionsQuery.data ?? []).filter(
    (area) => !linkedIds.has(area.id),
  );

  async function addGeoArea() {
    if (!selectedGeoAreaId) return;
    try {
      await addMutation.mutateAsync(selectedGeoAreaId);
      setSelectedGeoAreaId("");
      setSearch("");
      onFeedback("Territoire ajouté au sommet.", "success");
    } catch (error) {
      onFeedback(getApiErrorMessage(error), "error");
    }
  }

  async function removeGeoArea(geoAreaId: string, name: string) {
    if (!window.confirm(`Retirer le territoire « ${name} » de ce sommet ?`)) {
      return;
    }
    try {
      await removeMutation.mutateAsync(geoAreaId);
      onFeedback("Territoire retiré du sommet.", "success");
    } catch (error) {
      onFeedback(getApiErrorMessage(error), "error");
    }
  }

  async function changePrimaryMassif(geoAreaId: string) {
    if (!geoAreaId || geoAreaId === summit.primaryMassifId) return;
    try {
      await primaryMassifMutation.mutateAsync(geoAreaId);
      onFeedback("Massif principal mis à jour.", "success");
    } catch (error) {
      onFeedback(getApiErrorMessage(error), "error");
    }
  }

  return (
    <section className={styles.detailSection} aria-labelledby="geography-title">
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIcon}>
          <MapPinned />
        </span>
        <div>
          <span className={styles.kicker}>Architecture Phase A</span>
          <h3 id="geography-title">Géographie</h3>
        </div>
      </div>

      <label className={styles.fieldGroup}>
        <span>Massif principal</span>
        <select
          aria-label="Massif principal"
          value={summit.primaryMassifId ?? ""}
          onChange={(event) => void changePrimaryMassif(event.target.value)}
          disabled={primaryMassifMutation.isPending || massifsQuery.isLoading}
        >
          <option value="">Non défini</option>
          {(massifsQuery.data ?? []).map((area) => (
            <option key={area.id} value={area.id}>
              {area.hierarchy?.join(" › ") ?? area.name}
              {!area.isPublished ? " · non publié" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.geoAreaList}>
        {summit.geoAreas.map((area) => (
          <article key={area.id}>
            <div>
              <strong>{area.name}</strong>
              <span>{area.type.replaceAll("_", " ")}</span>
              {area.hierarchy && area.hierarchy.length > 1 ? (
                <small>{area.hierarchy.join(" › ")}</small>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={`Retirer ${area.name}`}
              disabled={
                area.id === summit.primaryMassifId || removeMutation.isPending
              }
              onClick={() => void removeGeoArea(area.id, area.name)}
              title={
                area.id === summit.primaryMassifId
                  ? "Changez d’abord le massif principal"
                  : "Retirer ce territoire"
              }
            >
              <Trash2 />
            </button>
          </article>
        ))}
      </div>

      <div className={styles.addGeoArea}>
        <label className={styles.fieldGroup}>
          <span>Rechercher un territoire existant</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom ou slug du territoire"
          />
        </label>
        <div className={styles.addGeoAreaRow}>
          <select
            aria-label="Territoire à ajouter"
            value={selectedGeoAreaId}
            onChange={(event) => setSelectedGeoAreaId(event.target.value)}
            disabled={optionsQuery.isLoading}
          >
            <option value="">
              {optionsQuery.isLoading
                ? "Recherche…"
                : availableOptions.length === 0
                  ? "Aucun territoire disponible"
                  : "Sélectionner un territoire"}
            </option>
            {availableOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.hierarchy?.join(" › ") ?? area.name} ·{" "}
                {area.type.replaceAll("_", " ")}
                {!area.isPublished ? " · non publié" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!selectedGeoAreaId || addMutation.isPending}
            onClick={() => void addGeoArea()}
          >
            <Plus />
            {addMutation.isPending ? "Ajout…" : "Ajouter"}
          </button>
        </div>
      </div>
    </section>
  );
}
