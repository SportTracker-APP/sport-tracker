import { api } from "./api";

export interface Activity {
  id: string;

  title: string | null;

  type: string;

  sport: string;

  distance: number | null;

  duration: number;

  calories: number | null;

  startedAt: string;
}

export async function getActivities() {
  const { data } = await api.get<Activity[]>(
    "/activities",
  );

  return data;
}