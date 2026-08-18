"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addAdminSummitGeoArea,
  getAdminGeoAreaOptions,
  getAdminSummit,
  getAdminSummitImportRun,
  getAdminSummits,
  removeAdminSummitGeoArea,
  updateAdminSummit,
  updateAdminSummitPrimaryMassif,
  getAdminSummitImportRuns,
  publishAdminSummitImportRun,
  updateAdminSummitImportCandidate,
  type AdminImportCandidateView,
  type SummitCatalogTier,
  type AdminSummitListParams,
  type UpdateAdminSummitInput,
} from "@/lib/admin-summits";

export const adminSummitKeys = {
  all: ["admin", "summits"] as const,
  list: (params: AdminSummitListParams) =>
    [...adminSummitKeys.all, "list", params] as const,
  detail: (summitId: string) =>
    [...adminSummitKeys.all, "detail", summitId] as const,
  geoAreas: (search: string, type?: string) =>
    ["admin", "geo-areas", search, type ?? "ALL"] as const,
  importRuns: ["admin", "summits", "import-runs"] as const,
  importRun: (
    importRunId: string,
    tier?: SummitCatalogTier,
    view?: AdminImportCandidateView,
  ) => ["admin", "summits", "import-runs", importRunId, tier, view] as const,
};

export function useAdminSummitImportRuns(enabled = true) {
  return useQuery({
    queryKey: adminSummitKeys.importRuns,
    queryFn: getAdminSummitImportRuns,
    enabled,
  });
}

export function useAdminSummitImportRun(
  importRunId: string | null,
  enabled = true,
  tier?: SummitCatalogTier,
  view: AdminImportCandidateView = "ALL",
) {
  return useQuery({
    queryKey: adminSummitKeys.importRun(importRunId ?? "", tier, view),
    queryFn: () => getAdminSummitImportRun(importRunId!, { tier, view }),
    enabled: enabled && Boolean(importRunId),
  });
}

export function useUpdateAdminSummitImportCandidate(importRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      candidateId,
      input,
    }: {
      candidateId: string;
      input: Parameters<typeof updateAdminSummitImportCandidate>[2];
    }) => updateAdminSummitImportCandidate(importRunId, candidateId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminSummitKeys.all });
    },
  });
}

export function usePublishAdminSummitImportRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishAdminSummitImportRun,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminSummitKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["summits"] });
    },
  });
}

export function useAdminSummits(params: AdminSummitListParams, enabled = true) {
  return useQuery({
    queryKey: adminSummitKeys.list(params),
    queryFn: () => getAdminSummits(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminSummit(summitId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminSummitKeys.detail(summitId ?? ""),
    queryFn: () => getAdminSummit(summitId!),
    enabled: enabled && Boolean(summitId),
  });
}

export function useAdminGeoAreaOptions(
  search: string,
  type?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: adminSummitKeys.geoAreas(search, type),
    queryFn: () => getAdminGeoAreaOptions(search, type),
    enabled,
  });
}

function useInvalidateAdminSummits(summitId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminSummitKeys.all });
    void queryClient.invalidateQueries({
      queryKey: adminSummitKeys.detail(summitId),
    });
    // The public catalogue feeds both the summit search and Exploration.
    // Invalidate it after every catalogue change so a newly hidden summit
    // cannot remain visible from the administrator's client-side cache.
    void queryClient.invalidateQueries({ queryKey: ["summits"] });
  };
}

export function useUpdateAdminSummit(summitId: string) {
  const invalidate = useInvalidateAdminSummits(summitId);
  return useMutation({
    mutationFn: (input: UpdateAdminSummitInput) =>
      updateAdminSummit(summitId, input),
    onSuccess: invalidate,
  });
}

export function useAddAdminSummitGeoArea(summitId: string) {
  const invalidate = useInvalidateAdminSummits(summitId);
  return useMutation({
    mutationFn: (geoAreaId: string) =>
      addAdminSummitGeoArea(summitId, geoAreaId),
    onSuccess: invalidate,
  });
}

export function useRemoveAdminSummitGeoArea(summitId: string) {
  const invalidate = useInvalidateAdminSummits(summitId);
  return useMutation({
    mutationFn: (geoAreaId: string) =>
      removeAdminSummitGeoArea(summitId, geoAreaId),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminSummitPrimaryMassif(summitId: string) {
  const invalidate = useInvalidateAdminSummits(summitId);
  return useMutation({
    mutationFn: (geoAreaId: string) =>
      updateAdminSummitPrimaryMassif(summitId, geoAreaId),
    onSuccess: invalidate,
  });
}
