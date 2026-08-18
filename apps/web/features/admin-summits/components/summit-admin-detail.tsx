"use client";

import { Eye, EyeOff, Mountain, X } from "lucide-react";
import { useState } from "react";

import { useUpdateAdminSummit } from "@/hooks/use-admin-summits";
import type {
  AdminSummitDetail,
  SummitCatalogStatus,
  SummitCatalogTier,
} from "@/lib/admin-summits";
import {
  getApiErrorMessage,
  SUMMIT_STATUS_LABELS,
} from "../admin-summit-utils";
import styles from "../admin-summits.module.css";
import { SummitAuditHistory } from "./summit-audit-history";
import { SummitDataQuality } from "./summit-data-quality";
import { SummitGeoAreasSection } from "./summit-geo-areas-section";
import { SummitIdentityForm } from "./summit-identity-form";

const STATUS_OPTIONS = Object.entries(SUMMIT_STATUS_LABELS) as Array<
  [SummitCatalogStatus, string]
>;

const TIER_OPTIONS: Array<[SummitCatalogTier, string]> = [
  ["CORE", "CORE — carnet & progression"],
  ["SECONDARY", "SECONDARY — informatif"],
  ["REFERENCE", "REFERENCE — interne"],
];

const ALLOWED_STATUS_TRANSITIONS: Record<
  SummitCatalogStatus,
  SummitCatalogStatus[]
> = {
  DRAFT: ["REVIEW", "READY", "ARCHIVED"],
  REVIEW: ["DRAFT", "READY", "ARCHIVED"],
  READY: ["REVIEW", "ARCHIVED"],
  ARCHIVED: ["DRAFT", "REVIEW"],
};

type SummitAdminDetailProps = {
  summit: AdminSummitDetail;
  onClose: () => void;
};

export function SummitAdminDetail({ summit, onClose }: SummitAdminDetailProps) {
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const updateMutation = useUpdateAdminSummit(summit.id);

  function notify(message: string, tone: "success" | "error") {
    setFeedback({ message, tone });
  }

  async function changeStatus(catalogStatus: SummitCatalogStatus) {
    if (catalogStatus === summit.catalogStatus) return;
    try {
      await updateMutation.mutateAsync({ catalogStatus });
      notify("Statut catalogue mis à jour.", "success");
    } catch (error) {
      notify(getApiErrorMessage(error), "error");
    }
  }

  async function togglePublication() {
    const nextPublishedState = !summit.isActive;
    if (
      !nextPublishedState &&
      !window.confirm(`Masquer « ${summit.name} » du catalogue public ?`)
    ) {
      return;
    }

    try {
      await updateMutation.mutateAsync({ isActive: nextPublishedState });
      notify(
        nextPublishedState
          ? "Sommet publié dans le catalogue."
          : "Sommet masqué du catalogue public.",
        "success",
      );
    } catch (error) {
      notify(getApiErrorMessage(error), "error");
    }
  }

  async function changeTier(catalogTier: SummitCatalogTier) {
    if (catalogTier === summit.catalogTier) return;
    if (
      !window.confirm(
        "Ce changement modifie la visibilité, la découverte automatique et la progression. Continuer ?",
      )
    ) {
      return;
    }
    try {
      await updateMutation.mutateAsync({ catalogTier });
      notify("Tier produit mis à jour et historisé.", "success");
    } catch (error) {
      notify(getApiErrorMessage(error), "error");
    }
  }

  return (
    <aside
      className={styles.detailPanel}
      aria-label={`Gestion de ${summit.name}`}
    >
      <header className={styles.detailHeader}>
        <div className={styles.detailIdentity}>
          <span className={styles.detailMountain} aria-hidden="true">
            <Mountain />
          </span>
          <div>
            <span className={styles.kicker}>Fiche catalogue</span>
            <h2>{summit.name}</h2>
            <p>
              {summit.altitude.toLocaleString("fr-FR")} m · {summit.id}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Fermer la fiche"
          onClick={onClose}
        >
          <X />
        </button>
      </header>

      {feedback && (
        <div
          className={styles.feedback}
          data-tone={feedback.tone}
          role="status"
        >
          {feedback.message}
        </div>
      )}

      <section
        className={styles.catalogControls}
        aria-label="État du catalogue"
      >
        <label className={styles.fieldGroup}>
          <span>Statut</span>
          <select
            value={summit.catalogStatus}
            disabled={updateMutation.isPending}
            onChange={(event) =>
              void changeStatus(event.target.value as SummitCatalogStatus)
            }
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option
                key={value}
                value={value}
                disabled={
                  value !== summit.catalogStatus &&
                  !ALLOWED_STATUS_TRANSITIONS[summit.catalogStatus].includes(
                    value,
                  )
                }
              >
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldGroup}>
          <span>Tier produit</span>
          <select
            value={summit.catalogTier}
            disabled={updateMutation.isPending}
            onChange={(event) =>
              void changeTier(event.target.value as SummitCatalogTier)
            }
          >
            {TIER_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <small>
            Suggéré : {summit.suggestedTier ?? "—"} · {summit.tierReason ?? "Raison non renseignée"}
          </small>
        </label>

        <div className={styles.publicationControl}>
          <div>
            <span>Publication</span>
            <strong>{summit.isActive ? "Publié" : "Masqué"}</strong>
          </div>
          <button
            type="button"
            data-published={summit.isActive}
            disabled={
              updateMutation.isPending ||
              (!summit.isActive &&
                (summit.catalogStatus !== "READY" ||
                  summit.catalogTier === "REFERENCE" ||
                  !summit.quality.isComplete))
            }
            onClick={() => void togglePublication()}
          >
            {summit.isActive ? <EyeOff /> : <Eye />}
            {summit.isActive ? "Masquer" : "Publier"}
          </button>
        </div>
      </section>

      <SummitDataQuality quality={summit.quality} />

      <section
        className={styles.detailSection}
        aria-labelledby="identity-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.sectionIcon}>
            <Mountain />
          </span>
          <div>
            <span className={styles.kicker}>Données essentielles</span>
            <h3 id="identity-title">Identité</h3>
          </div>
        </div>
        <SummitIdentityForm summit={summit} onFeedback={notify} />
      </section>

      <SummitGeoAreasSection summit={summit} onFeedback={notify} />
      <SummitAuditHistory logs={summit.adminAuditLogs} />
    </aside>
  );
}
