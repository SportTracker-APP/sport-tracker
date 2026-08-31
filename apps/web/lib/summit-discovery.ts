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
  | "maxAltitude"
  | "coverImageUrl"
>;

export type SummitView = Summit & {
  department?: string | null;
  discovered: boolean;
  closestDistance: number | null;
  activityCount: number;
  firstActivity: SummitActivitySummary | null;
  latestActivity: SummitActivitySummary | null;
  firstDiscoveredAt: string | null;
  latestDiscoveredAt: string | null;
  pendingDiscoveries: Array<{
    id: string;
    confidence: number;
    closestDistance: number;
    activity: SummitActivitySummary;
  }>;
};

export type ExplorationSummit = Pick<
  SummitView,
  | "id"
  | "name"
  | "altitude"
  | "catalogTier"
  | "coordinates"
  | "discovered"
  | "firstDiscoveredAt"
  | "latestDiscoveredAt"
>;

export type MassifProgress = {
  massif: string;
  total: number;
  discovered: number;
  progress: number;
};

export type DepartmentProgress = {
  department: string;
  total: number;
  discovered: number;
  progress: number;
};

export function getSummitMassifName(summit: Summit) {
  return (
    summit.primaryMassif?.name ??
    summit.geoAreas?.find(({ type }) => type === "MASSIF")?.name ??
    summit.massif
  );
}

export function getSummitSearchNames(summit: Summit) {
  return [summit.name, ...(summit.aliases ?? [])]
    .map((name) => normalizeSummitName(name))
    .filter(Boolean);
}

export function getMassifProgress(summits: SummitView[]) {
  return Object.values(
    summits.reduce<Record<string, MassifProgress>>((accumulator, summit) => {
      const massifName = getSummitMassifName(summit);
      const current = accumulator[massifName] ?? {
        massif: massifName,
        total: 0,
        discovered: 0,
        progress: 0,
      };

      current.total += 1;
      current.discovered += summit.discovered ? 1 : 0;
      current.progress = Math.round((current.discovered / current.total) * 100);
      accumulator[massifName] = current;

      return accumulator;
    }, {}),
  ).sort((firstMassif, secondMassif) => {
    if (secondMassif.progress !== firstMassif.progress) {
      return secondMassif.progress - firstMassif.progress;
    }

    return secondMassif.total - firstMassif.total;
  });
}

export function getDepartmentProgress(summits: SummitView[]) {
  const progressByDepartment = summits.reduce<
    Record<string, DepartmentProgress>
  >((accumulator, summit) => {
    const departments = summit.geoAreas?.filter(
      ({ type }) => type === "DEPARTMENT",
    );
    const departmentNames = new Set(
      departments?.length
        ? departments.map(({ name }) => name)
        : summit.department
          ? [summit.department]
          : [],
    );

    for (const department of departmentNames) {
      const current = accumulator[department] ?? {
        department,
        total: 0,
        discovered: 0,
        progress: 0,
      };
      current.total += 1;
      current.discovered += summit.discovered ? 1 : 0;
      current.progress = Math.round((current.discovered / current.total) * 100);
      accumulator[department] = current;
    }

    return accumulator;
  }, {});

  return Object.values(progressByDepartment).sort((first, second) =>
    first.department.localeCompare(second.department, "fr"),
  );
}
