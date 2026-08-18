import type {
  SummitAdminAuditAction,
  SummitCatalogStatus,
} from "@/lib/admin-summits";

export const SUMMIT_STATUS_LABELS: Record<SummitCatalogStatus, string> = {
  DRAFT: "Brouillon",
  REVIEW: "À vérifier",
  READY: "Prêt",
  ARCHIVED: "Archivé",
};

export const AUDIT_ACTION_LABELS: Record<SummitAdminAuditAction, string> = {
  SUMMIT_UPDATED: "Informations modifiées",
  STATUS_CHANGED: "Statut modifié",
  PUBLICATION_CHANGED: "Publication modifiée",
  PRIMARY_MASSIF_CHANGED: "Massif principal modifié",
  GEO_AREA_ADDED: "Territoire ajouté",
  GEO_AREA_REMOVED: "Territoire retiré",
  IMPORT_BATCH_PUBLISHED: "Publication d’un lot importé",
  TIER_CHANGED: "Tier produit modifié",
};

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getApiErrorMessage(error: unknown) {
  const response = (
    error as { response?: { data?: { message?: string | string[] } } }
  ).response;
  const message = response?.data?.message;
  if (Array.isArray(message)) return message.join(" · ");
  return message ?? "La modification n’a pas pu être enregistrée.";
}
