import { History } from "lucide-react";

import type { SummitAdminAuditLog } from "@/lib/admin-summits";
import { AUDIT_ACTION_LABELS, formatAdminDate } from "../admin-summit-utils";
import styles from "../admin-summits.module.css";

function getAuditDetail(log: SummitAdminAuditLog) {
  if (log.action === "GEO_AREA_ADDED") {
    return String(log.after?.name ?? "Territoire");
  }
  if (log.action === "GEO_AREA_REMOVED") {
    return String(log.before?.name ?? "Territoire");
  }
  if (log.action === "PRIMARY_MASSIF_CHANGED") {
    return `${String(log.before?.name ?? "Non défini")} → ${String(
      log.after?.name ?? "Non défini",
    )}`;
  }
  if (log.action === "STATUS_CHANGED") {
    return `${String(log.before?.catalogStatus ?? "—")} → ${String(
      log.after?.catalogStatus ?? "—",
    )}`;
  }
  if (log.action === "PUBLICATION_CHANGED") {
    return log.after?.isActive ? "Sommet publié" : "Sommet masqué";
  }
  if (log.action === "TIER_CHANGED") {
    return `${String(log.before?.catalogTier ?? "—")} → ${String(
      log.after?.catalogTier ?? "—",
    )}`;
  }
  return "Informations du sommet mises à jour";
}

export function SummitAuditHistory({ logs }: { logs: SummitAdminAuditLog[] }) {
  return (
    <section className={styles.historyCard} aria-labelledby="history-title">
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIcon}>
          <History />
        </span>
        <div>
          <span className={styles.kicker}>Journal interne</span>
          <h3 id="history-title">Historique</h3>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className={styles.emptyInline}>Aucune modification enregistrée.</p>
      ) : (
        <ol className={styles.historyList}>
          {logs.map((log) => (
            <li key={log.id}>
              <span className={styles.historyMark} aria-hidden="true" />
              <div>
                <strong>{AUDIT_ACTION_LABELS[log.action]}</strong>
                <p>{getAuditDetail(log)}</p>
                <small>
                  {formatAdminDate(log.createdAt)} · par{" "}
                  {log.adminUser?.firstName ?? "Administrateur supprimé"}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
