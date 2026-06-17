import { api } from "./api";

export interface Activity {
  id: string;

  title: string | null;

  description: string | null;

  stravaActivityId?: string | null;

  type: string;

  sport: string;

  status: string;

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
}

export async function getActivities() {
  const { data } = await api.get<Activity[]>("/activities");

  return data;
}

export async function getActivity(id: string) {
  const { data } = await api.get<Activity>(`/activities/${id}`);

  return data;
}
