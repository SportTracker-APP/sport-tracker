"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getExplorationSummits,
  getSummitBadges,
  getSummits,
  removeSummitFromDiscoveries,
  updateSummitDiscovery,
  type SummitQuery,
} from "@/lib/summit-api";

function normalizedQuery(
  geoAreaIds: string[],
  includeSecondary = false,
): SummitQuery {
  return {
    ...(geoAreaIds.length > 0
      ? {
          geoAreaIds: [...geoAreaIds].sort().join(","),
          includeDescendants: true,
        }
      : {}),
    ...(includeSecondary ? { includeSecondary: true } : {}),
  };
}

export function useSummits(
  geoAreaIds: string[] = [],
  enabled = true,
  includeSecondary = false,
) {
  const query = normalizedQuery(geoAreaIds, includeSecondary);
  return useQuery({
    queryKey: [
      "summits",
      "catalog",
      query.geoAreaIds ?? "ALL",
      includeSecondary ? "WITH_SECONDARY" : "CORE_ONLY",
    ],
    queryFn: () => getSummits(query),
    enabled,
  });
}

export function useExplorationSummits(
  geoAreaIds: string[] = [],
  enabled = true,
) {
  const query = normalizedQuery(geoAreaIds);
  return useQuery({
    queryKey: ["summits", "map", query.geoAreaIds ?? "ALL"],
    queryFn: () => getExplorationSummits(query),
    enabled,
  });
}

export function useSummitBadges() {
  return useQuery({
    queryKey: ["summit-badges"],
    queryFn: getSummitBadges,
  });
}

export function useUpdateSummitDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discoveryId,
      status,
    }: {
      discoveryId: string;
      status: "CONFIRMED" | "DISMISSED";
    }) => updateSummitDiscovery(discoveryId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["summits"] });
      void queryClient.invalidateQueries({ queryKey: ["summit-badges"] });
    },
  });
}

export function useRemoveSummitDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeSummitFromDiscoveries,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["summits"] });
      void queryClient.invalidateQueries({ queryKey: ["summit-badges"] });
    },
  });
}
