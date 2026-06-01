"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getActivities,
} from "@/lib/activities";

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],

    queryFn: getActivities,
  });
}