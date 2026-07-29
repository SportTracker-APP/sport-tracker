import { api } from "./api";

export interface Activity {
  id: string;

  title: string | null;

  description: string | null;

  stravaActivityId?: string | null;

  type: string;

  sport: string;

  status: string;

  plannedWorkoutId: string | null;

  completedActivityId: string | null;

  completedAt: string | null;

  celebrationSeenAt: string | null;

  plannedWorkout?: Activity | null;

  completedActivity?: Activity | null;

  distance: number | null;

  duration: number;

  movingTime: number | null;

  elevationGain: number | null;

  elevationLoss: number | null;

  maxAltitude: number | null;

  minAltitude?: number | null;

  calories: number | null;

  averageSpeed: number | null;

  maxSpeed: number | null;

  pace: number | null;

  averageHeartRate: number | null;

  maxHeartRate: number | null;

  temperature: number | null;

  weather: string | null;

  city: string | null;

  country: string | null;

  startLatitude: number | null;

  startLongitude: number | null;

  endLatitude: number | null;

  endLongitude: number | null;

  routePolyline: string | null;

  coverImageUrl: string | null;

  photoUrls?: string[] | null;

  photoCount?: number | null;

  altitudeStream?: number[] | null;

  distanceStream?: number[] | null;

  startedAt: string;

  createdAt: string;

  updatedAt: string;
}

export async function getActivities() {
  const { data } = await api.get<Activity[]>("/activities");

  return data;
}

export async function getActivity(id: string) {
  const { data } = await api.get<Activity>(`/activities/${id}`);

  return data;
}

export async function deleteActivity(id: string) {
  await api.delete(`/activities/${id}`);
}

export async function markPlannedWorkoutCompleted(activityId: string) {
  const { data } = await api.patch<Activity>(`/activities/${activityId}`, {
    status: "COMPLETED",
  });

  return data;
}

export async function completePlannedWorkout(
  plannedWorkoutId: string,
  activityId: string,
) {
  const { data } = await api.post<Activity>(
    `/activities/planned-workouts/${plannedWorkoutId}/complete`,
    { activityId },
  );

  return data;
}

export async function markPlannedWorkoutCelebrationSeen(
  plannedWorkoutId: string,
) {
  const { data } = await api.patch<Activity>(
    `/activities/planned-workouts/${plannedWorkoutId}/celebration-seen`,
  );

  return data;
}

export async function getPlannedWorkoutSuggestion(activityId: string) {
  const { data } = await api.get<Activity | null>(
    `/activities/${activityId}/planned-workout-suggestion`,
  );

  return data;
}
