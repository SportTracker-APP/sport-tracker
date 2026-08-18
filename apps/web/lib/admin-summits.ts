import { api } from "./api";

export type SummitCatalogStatus = "DRAFT" | "REVIEW" | "READY" | "ARCHIVED";
export type SummitCatalogTier = "CORE" | "SECONDARY" | "REFERENCE";

export type AdminGeoArea = {
  id: string;
  name: string;
  slug: string;
  type: string;
  isPublished: boolean;
  parent?: { id: string; name: string; type: string } | null;
  hierarchy?: string[];
};

export type SummitDataQuality = {
  isComplete: boolean;
  missingCount: number;
  missing: Array<{ code: string; label: string }>;
};

export type AdminSummitListItem = {
  id: string;
  name: string;
  altitude: number;
  latitude: number;
  longitude: number;
  massif: string;
  catalogStatus: SummitCatalogStatus;
  catalogTier: SummitCatalogTier;
  suggestedTier: SummitCatalogTier | null;
  tierReason: string | null;
  isActive: boolean;
  primaryMassifId: string | null;
  primaryMassif: AdminGeoArea | null;
  geoAreaCount: number;
  quality: SummitDataQuality;
};

export type SummitAdminAuditAction =
  | "SUMMIT_UPDATED"
  | "STATUS_CHANGED"
  | "PUBLICATION_CHANGED"
  | "PRIMARY_MASSIF_CHANGED"
  | "GEO_AREA_ADDED"
  | "GEO_AREA_REMOVED"
  | "IMPORT_BATCH_PUBLISHED"
  | "TIER_CHANGED";

export type AdminSummitImportRun = {
  id: string;
  provider: "IGN_BD_TOPO";
  scope: string;
  sourceVersion: string;
  sourceName: string;
  status: "PREVIEWED" | "PREPARED" | "APPLIED" | "PUBLISHED" | "FAILED";
  startedAt: string;
  completedAt: string | null;
  sourceCount: number;
  candidateCount: number;
  createdCount: number;
  matchedCount: number;
  conflictCount: number;
  rejectedCount: number;
  errorCount: number;
  publishableCount: number;
  candidateStatuses: Record<string, number>;
  suggestedTiers: Record<SummitCatalogTier, number>;
  resolvedConflictCount: number;
  unresolvedConflictCount: number;
  legacyMatchCount: number;
  homonymCandidateCount: number;
  withoutMassifCount: number;
};

export type AdminSummitImportCandidate = {
  id: string;
  externalId: string;
  name: string;
  status:
    | "NEW"
    | "MATCHED"
    | "CONFLICT"
    | "REJECTED"
    | "READY"
    | "IMPORTED"
    | "SKIPPED";
  suggestedTier: SummitCatalogTier;
  catalogTier: SummitCatalogTier;
  tierReason: string;
  classificationSignals: Record<string, unknown>;
  isLegacyMatch: boolean;
  homonymGroupSize: number;
  resolutionAction:
    | "MATCH_EXISTING"
    | "CREATE_NEW"
    | "IGNORE"
    | "KEEP_FOR_REVIEW"
    | null;
  resolutionReason: string | null;
  errorMessage: string | null;
  matchedSummit: {
    id: string;
    name: string;
    primaryMassif?: { id: string; name: string } | null;
  } | null;
};

export type AdminSummitImportRunDetail = Omit<
  AdminSummitImportRun,
  | "publishableCount"
  | "candidateStatuses"
  | "suggestedTiers"
  | "resolvedConflictCount"
  | "unresolvedConflictCount"
  | "legacyMatchCount"
  | "homonymCandidateCount"
  | "withoutMassifCount"
> & {
  candidates: AdminSummitImportCandidate[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SummitAdminAuditLog = {
  id: string;
  action: SummitAdminAuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  adminUser: {
    id: string;
    firstName: string;
    email: string;
  } | null;
};

export type AdminSummitDetail = AdminSummitListItem & {
  aliases: string[];
  difficulty: string;
  type: string;
  imageUrl: string | null;
  imageCredit: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  geoAreas: AdminGeoArea[];
  adminAuditLogs: SummitAdminAuditLog[];
};

export type AdminSummitListResponse = {
  items: AdminSummitListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type AdminSummitListParams = {
  search?: string;
  status?: SummitCatalogStatus | "";
  published?: "" | "true" | "false";
  massifMissing?: "" | "true" | "false";
  tier?: SummitCatalogTier | "";
  page: number;
  pageSize?: number;
};

export type UpdateAdminSummitInput = Partial<{
  name: string;
  aliases: string[];
  altitude: number;
  latitude: number;
  longitude: number;
  difficulty: string;
  type: string;
  catalogStatus: SummitCatalogStatus;
  catalogTier: SummitCatalogTier;
  isActive: boolean;
}>;

export async function getAdminSummits(params: AdminSummitListParams) {
  const { data } = await api.get<AdminSummitListResponse>("/admin/summits", {
    params: {
      ...params,
      status: params.status || undefined,
      published: params.published || undefined,
      massifMissing: params.massifMissing || undefined,
      tier: params.tier || undefined,
    },
  });
  return data;
}

export async function getAdminSummit(summitId: string) {
  const { data } = await api.get<AdminSummitDetail>(
    `/admin/summits/${summitId}`,
  );
  return data;
}

export async function getAdminGeoAreaOptions(search = "", type?: string) {
  const { data } = await api.get<AdminGeoArea[]>(
    "/admin/summits/geo-areas/options",
    { params: { search: search || undefined, type } },
  );
  return data;
}

export async function updateAdminSummit(
  summitId: string,
  input: UpdateAdminSummitInput,
) {
  const { data } = await api.patch<AdminSummitDetail>(
    `/admin/summits/${summitId}`,
    input,
  );
  return data;
}

export async function addAdminSummitGeoArea(
  summitId: string,
  geoAreaId: string,
) {
  const { data } = await api.post<AdminSummitDetail>(
    `/admin/summits/${summitId}/geo-areas`,
    { geoAreaId },
  );
  return data;
}

export async function removeAdminSummitGeoArea(
  summitId: string,
  geoAreaId: string,
) {
  const { data } = await api.delete<AdminSummitDetail>(
    `/admin/summits/${summitId}/geo-areas/${geoAreaId}`,
  );
  return data;
}

export async function updateAdminSummitPrimaryMassif(
  summitId: string,
  geoAreaId: string,
) {
  const { data } = await api.patch<AdminSummitDetail>(
    `/admin/summits/${summitId}/primary-massif`,
    { geoAreaId },
  );
  return data;
}

export async function getAdminSummitImportRuns() {
  const { data } = await api.get<AdminSummitImportRun[]>(
    "/admin/summits/import-runs",
  );
  return data;
}

export type AdminImportCandidateView =
  | "ALL"
  | "CONFLICTS"
  | "LEGACY"
  | "WITHOUT_MASSIF"
  | "RESOLVED"
  | "HOMONYMS";

export async function getAdminSummitImportRun(
  importRunId: string,
  params: {
    tier?: SummitCatalogTier;
    view?: AdminImportCandidateView;
    page?: number;
  } = {},
) {
  const { data } = await api.get<AdminSummitImportRunDetail>(
    `/admin/summits/import-runs/${importRunId}`,
    { params },
  );
  return data;
}

export async function updateAdminSummitImportCandidate(
  importRunId: string,
  candidateId: string,
  input: Partial<{
    catalogTier: SummitCatalogTier;
    resolutionAction:
      | "MATCH_EXISTING"
      | "CREATE_NEW"
      | "IGNORE"
      | "KEEP_FOR_REVIEW";
    resolutionReason: string;
    matchedSummitId: string;
  }>,
) {
  const { data } = await api.patch<AdminSummitImportCandidate>(
    `/admin/summits/import-runs/${importRunId}/candidates/${candidateId}`,
    input,
  );
  return data;
}

export async function publishAdminSummitImportRun(importRunId: string) {
  const { data } = await api.post<{
    importRunId: string;
    publishedCount: number;
  }>(`/admin/summits/import-runs/${importRunId}/publish`);
  return data;
}
