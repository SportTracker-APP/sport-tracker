import type { Activity } from "./activities";
import { normalizeSummitName, type Summit } from "./summits";

export type SummitActivitySummary = Pick<
  Activity,
  | "id"
  | "title"
  | "sport"
  | "startedAt"
  | "distance"
  | "elevationGain"
  | "coverImageUrl"
>;

export type SummitView = Summit & {
  discovered: boolean;
  closestDistance: number | null;
  activityCount: number;
  firstActivity: SummitActivitySummary | null;
  latestActivity: SummitActivitySummary | null;
  pendingDiscoveries: Array<{
    id: string;
    confidence: number;
    closestDistance: number;
    activity: SummitActivitySummary;
  }>;
};

export type MassifProgress = {
  massif: string;
  total: number;
  discovered: number;
  progress: number;
};

export function getSummitSearchNames(summit: Summit) {
  return [summit.name, ...(summit.aliases ?? [])]
    .map((name) => normalizeSummitName(name))
    .filter(Boolean);
}

export function getMassifProgress(summits: SummitView[]) {
  return Object.values(
    summits.reduce<Record<string, MassifProgress>>((accumulator, summit) => {
      const current = accumulator[summit.massif] ?? {
        massif: summit.massif,
        total: 0,
        discovered: 0,
        progress: 0,
      };

      current.total += 1;
      current.discovered += summit.discovered ? 1 : 0;
      current.progress = Math.round((current.discovered / current.total) * 100);
      accumulator[summit.massif] = current;

      return accumulator;
    }, {}),
  ).sort((firstMassif, secondMassif) => {
    if (secondMassif.progress !== firstMassif.progress) {
      return secondMassif.progress - firstMassif.progress;
    }

    return secondMassif.total - firstMassif.total;
  });
}
