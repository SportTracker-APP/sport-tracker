"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDiscoveryGeoOptions,
  getGeoPreferences,
  updateDiscoveryGeoPreferences,
} from "@/lib/geo-preferences";

export const geoPreferenceKeys = {
  all: ["geo-preferences"] as const,
  options: ["geo-preferences", "options"] as const,
  mine: ["geo-preferences", "mine"] as const,
};

export function useDiscoveryGeoOptions() {
  return useQuery({
    queryKey: geoPreferenceKeys.options,
    queryFn: getDiscoveryGeoOptions,
  });
}

export function useGeoPreferences() {
  return useQuery({
    queryKey: geoPreferenceKeys.mine,
    queryFn: getGeoPreferences,
  });
}

export function useUpdateDiscoveryGeoPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDiscoveryGeoPreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: geoPreferenceKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["summits"] });
    },
  });
}
