import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Mountain,
} from "lucide-react";

import type {
  AdminSummitListItem,
  AdminSummitListResponse,
} from "@/lib/admin-summits";
import { SUMMIT_STATUS_LABELS } from "../admin-summit-utils";
import styles from "../admin-summits.module.css";

type SummitAdminTableProps = {
  summits: AdminSummitListItem[];
  pagination: AdminSummitListResponse["pagination"];
  selectedSummitId: string | null;
  onSelect: (summitId: string) => void;
  onPageChange: (page: number) => void;
};

export function SummitAdminTable({
  summits,
  pagination,
  selectedSummitId,
  onSelect,
  onPageChange,
}: SummitAdminTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sommet</th>
              <th>Altitude</th>
              <th>Massif principal</th>
              <th>Statut</th>
              <th>Tier</th>
              <th>Publication</th>
              <th>Qualité</th>
            </tr>
          </thead>
          <tbody>
            {summits.map((summit) => (
              <tr
                key={summit.id}
                data-selected={selectedSummitId === summit.id}
              >
                <td>
                  <button
                    type="button"
                    className={styles.summitLink}
                    onClick={() => onSelect(summit.id)}
                  >
                    <span className={styles.summitIcon} aria-hidden="true">
                      <Mountain />
                    </span>
                    <span>
                      <strong>{summit.name}</strong>
                      <small>{summit.id}</small>
                    </span>
                  </button>
                </td>
                <td>{summit.altitude.toLocaleString("fr-FR")} m</td>
                <td>{summit.primaryMassif?.name ?? "Non défini"}</td>
                <td>
                  <span
                    className={styles.statusPill}
                    data-status={summit.catalogStatus}
                  >
                    {SUMMIT_STATUS_LABELS[summit.catalogStatus]}
                  </span>
                </td>
                <td>
                  <span
                    className={styles.statusPill}
                    data-tier={summit.catalogTier}
                  >
                    {summit.catalogTier}
                  </span>
                </td>
                <td>
                  <span
                    className={styles.publicationState}
                    data-published={summit.isActive}
                  >
                    {summit.isActive ? <Eye /> : <EyeOff />}
                    {summit.isActive ? "Publié" : "Masqué"}
                  </span>
                </td>
                <td>
                  <span
                    className={styles.qualityState}
                    data-complete={summit.quality.isComplete}
                  >
                    {summit.quality.isComplete ? (
                      <CheckCircle2 />
                    ) : (
                      <AlertTriangle />
                    )}
                    {summit.quality.isComplete
                      ? "Complet"
                      : `${summit.quality.missingCount} manque${
                          summit.quality.missingCount > 1 ? "s" : ""
                        }`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className={styles.pagination}>
        <p>
          {pagination.total.toLocaleString("fr-FR")} sommet
          {pagination.total > 1 ? "s" : ""} · page {pagination.page} sur{" "}
          {pagination.totalPages}
        </p>
        <div>
          <button
            type="button"
            aria-label="Page précédente"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Page suivante"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      </footer>
    </div>
  );
}
