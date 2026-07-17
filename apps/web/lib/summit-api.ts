import { api } from "./api";
import type { SummitView } from "./summit-discovery";

export type SummitBadge = {
  id: string;
  name: string;
  description: string;
  hint: string;
  icon: string;
  tone: "summit" | "fire" | "energy" | "sunrise" | "winter" | "rain";
  category:
    | "Distance"
    | "Sommets"
    | "Conditions"
    | "Exploits D+"
    | "Progression D+"
    | "Défis mensuels";
  criterion: string;
  progress: {
    current: number;
    target: number;
    unit: string;
  } | null;
  unlocked: boolean;
  unlockedAt: string | null;
};

export async function getSummits(): Promise<SummitView[]> {
  const { data } = await api.get<SummitView[]>("/summits");

  return data;
}

export async function getSummitBadges(): Promise<SummitBadge[]> {
  const { data } = await api.get<SummitBadge[]>("/summits/badges");

  return data;
}

export async function updateSummitDiscovery(
  discoveryId: string,
  status: "CONFIRMED" | "DISMISSED",
): Promise<void> {
  await api.patch(`/summits/discoveries/${discoveryId}`, { status });
}

export async function removeSummitFromDiscoveries(
  summitId: string,
): Promise<void> {
  await api.delete(`/summits/${summitId}/discovery`);
}
