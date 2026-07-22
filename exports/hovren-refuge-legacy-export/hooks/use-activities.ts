"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completePlannedWorkout,
  deleteActivity,
  getActivity,
  getActivities,
  getPlannedWorkoutSuggestion,
  markPlannedWorkoutCompleted,
  markPlannedWorkoutCelebrationSeen,
} from "@/lib/activities";

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

export function useCompletePlannedWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plannedWorkoutId,
      activityId,
    }: {
      plannedWorkoutId: string;
      activityId: string;
    }) => completePlannedWorkout(plannedWorkoutId, activityId),
    onSuccess: (plannedWorkout) => {
      void queryClient.invalidateQueries({ queryKey: ["activities"] });

      if (plannedWorkout.completedActivityId) {
        void queryClient.invalidateQueries({
          queryKey: ["activities", plannedWorkout.completedActivityId],
        });
      }
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useMarkPlannedWorkoutCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markPlannedWorkoutCompleted,
    onSuccess: (activity) => {
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
      void queryClient.invalidateQueries({
        queryKey: ["activities", activity.id],
      });
    },
  });
}

export function useMarkPlannedWorkoutCelebrationSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markPlannedWorkoutCelebrationSeen,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function usePlannedWorkoutSuggestion(activityId: string) {
  return useQuery({
    queryKey: ["activities", activityId, "planned-workout-suggestion"],
    queryFn: () => getPlannedWorkoutSuggestion(activityId),
    enabled: Boolean(activityId),
  });
}
