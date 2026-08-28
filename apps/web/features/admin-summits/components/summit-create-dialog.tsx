"use client";

import { MapPinned, Mountain, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  useAdminGeoAreaOptions,
  useCreateAdminSummit,
} from "@/hooks/use-admin-summits";
import type {
  AdminGeoArea,
  AdminSummitDetail,
  SummitCatalogStatus,
  SummitCatalogTier,
} from "@/lib/admin-summits";
import { getApiErrorMessage } from "../admin-summit-utils";
import { useDebouncedValue } from "../use-debounced-value";
import styles from "../admin-summits.module.css";

export function SummitCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (summit: AdminSummitDetail) => void;
}) {
  const create = useCreateAdminSummit();
  const [massifSearch, setMassifSearch] = useState("");
  const [territorySearch, setTerritorySearch] = useState("");
  const [massif, setMassif] = useState<AdminGeoArea | null>(null);
  const [territories, setTerritories] = useState<AdminGeoArea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState(false);
  const massifOptions = useAdminGeoAreaOptions(
    useDebouncedValue(massifSearch),
    "MASSIF",
    open,
  );
  const territoryOptions = useAdminGeoAreaOptions(
    useDebouncedValue(territorySearch),
    undefined,
    open,
  );

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    if (!massif) {
      setError("Sélectionne un massif principal existant.");
      return;
    }
    const isActive = form.get("isActive") === "on";
    const externalId = String(form.get("externalId") ?? "").trim();
    try {
      const summit = await create.mutateAsync({
        name: String(form.get("name") ?? ""),
        altitude: Number(form.get("altitude")),
        latitude: Number(form.get("latitude")),
        longitude: Number(form.get("longitude")),
        type: String(form.get("type") ?? "Sommet"),
        primaryMassifId: massif.id,
        geoAreaIds: territories.map((area) => area.id),
        catalogTier: String(form.get("catalogTier")) as SummitCatalogTier,
        catalogStatus: String(form.get("catalogStatus")) as SummitCatalogStatus,
        isActive,
        sourceUrl: String(form.get("sourceUrl") ?? "").trim() || undefined,
        ...(externalReference && externalId
          ? {
              externalReference: {
                provider: "IGN_BD_TOPO" as const,
                externalId,
                sourceName:
                  String(form.get("externalSourceName") ?? "").trim() ||
                  "Référence manuelle admin",
                sourceVersion:
                  String(form.get("externalSourceVersion") ?? "").trim() ||
                  undefined,
              },
            }
          : {}),
      });
      onCreated(summit);
      onOpenChange(false);
    } catch (creationError) {
      setError(getApiErrorMessage(creationError));
    }
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section
        className={styles.createDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-summit-title"
      >
        <header>
          <div>
            <span className={styles.kicker}>Création catalogue</span>
            <h2 id="create-summit-title">Nouveau sommet</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => onOpenChange(false)}
          >
            <X />
          </button>
        </header>

        <form onSubmit={(event) => void submit(event)}>
          {error ? (
            <p className={styles.dialogError} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.formGrid}>
            <label className={styles.fieldGroup}>
              <span>Nom</span>
              <input name="name" required maxLength={160} autoFocus />
            </label>
            <label className={styles.fieldGroup}>
              <span>Altitude (m)</span>
              <input
                name="altitude"
                type="number"
                min={1}
                max={9000}
                required
              />
            </label>
            <label className={styles.fieldGroup}>
              <span>Latitude</span>
              <input
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                required
              />
            </label>
            <label className={styles.fieldGroup}>
              <span>Longitude</span>
              <input
                name="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                required
              />
            </label>
            <label className={styles.fieldGroup}>
              <span>Type</span>
              <input
                name="type"
                defaultValue="Sommet"
                required
                maxLength={80}
              />
            </label>
            <label className={styles.fieldGroup}>
              <span>Tier</span>
              <select name="catalogTier" defaultValue="CORE">
                <option value="CORE">CORE</option>
                <option value="SECONDARY">SECONDARY</option>
                <option value="REFERENCE">REFERENCE</option>
              </select>
            </label>
            <label className={styles.fieldGroup}>
              <span>Statut catalogue</span>
              <select name="catalogStatus" defaultValue="DRAFT">
                <option value="DRAFT">Brouillon</option>
                <option value="REVIEW">À vérifier</option>
                <option value="READY">Prêt</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </label>
            <label className={styles.checkboxField}>
              <input name="isActive" type="checkbox" />
              Publier immédiatement
            </label>
          </div>

          <fieldset className={styles.createFieldset}>
            <legend>
              <Mountain /> Massif principal
            </legend>
            <input
              value={massifSearch}
              onChange={(event) => setMassifSearch(event.target.value)}
              placeholder="Rechercher un massif existant…"
            />
            {massif ? (
              <p className={styles.selectedArea}>
                {massif.name}
                <button type="button" onClick={() => setMassif(null)}>
                  <X />
                </button>
              </p>
            ) : (
              <select
                aria-label="Choisir le massif principal"
                value=""
                onChange={(event) => {
                  const selected = massifOptions.data?.find(
                    (area) => area.id === event.target.value,
                  );
                  if (selected) setMassif(selected);
                }}
              >
                <option value="">Sélectionner…</option>
                {(massifOptions.data ?? []).map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.hierarchy?.join(" › ") ?? area.name}
                  </option>
                ))}
              </select>
            )}
          </fieldset>

          <fieldset className={styles.createFieldset}>
            <legend>
              <MapPinned /> Territoires complémentaires
            </legend>
            <input
              value={territorySearch}
              onChange={(event) => setTerritorySearch(event.target.value)}
              placeholder="Département, parc, secteur…"
            />
            <select
              aria-label="Ajouter un territoire"
              value=""
              onChange={(event) => {
                const selected = territoryOptions.data?.find(
                  (area) => area.id === event.target.value,
                );
                if (
                  selected &&
                  !territories.some((area) => area.id === selected.id)
                ) {
                  setTerritories((current) => [...current, selected]);
                }
              }}
            >
              <option value="">Ajouter un territoire…</option>
              {(territoryOptions.data ?? []).map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} · {area.type}
                </option>
              ))}
            </select>
            <div className={styles.selectedAreas}>
              {territories.map((area) => (
                <span key={area.id}>
                  {area.name}
                  <button
                    type="button"
                    onClick={() =>
                      setTerritories((current) =>
                        current.filter((item) => item.id !== area.id),
                      )
                    }
                  >
                    <X />
                  </button>
                </span>
              ))}
            </div>
          </fieldset>

          <label className={styles.fieldGroup}>
            <span>Source générale éventuelle</span>
            <input name="sourceUrl" type="url" placeholder="https://…" />
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={externalReference}
              onChange={(event) => setExternalReference(event.target.checked)}
            />
            Ajouter une référence IGN
          </label>
          {externalReference ? (
            <div className={styles.formGrid}>
              <label className={styles.fieldGroup}>
                <span>Identifiant IGN</span>
                <input name="externalId" required />
              </label>
              <label className={styles.fieldGroup}>
                <span>Nom de la source</span>
                <input
                  name="externalSourceName"
                  defaultValue="IGN BD TOPO"
                  required
                />
              </label>
              <label className={styles.fieldGroup}>
                <span>Version</span>
                <input name="externalSourceVersion" placeholder="2026-07" />
              </label>
            </div>
          ) : null}

          <footer>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={create.isPending}
            >
              <Plus /> {create.isPending ? "Création…" : "Créer le sommet"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
