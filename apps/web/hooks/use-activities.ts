"use client";

import { useQuery } from "@tanstack/react-query";

import { getActivity, getActivities } from "@/lib/activities";

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],

    queryFn: getActivities,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ["activities", id],

    queryFn: () => getActivity(id),

    enabled: Boolean(id),
  });
}
