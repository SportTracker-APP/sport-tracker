"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { useActivities } from "@/hooks/use-activities";
import {
  getMassifProgress,
  getSummitViews,
  type SummitView,
} from "@/lib/summit-discovery";

export type SummitCelebrationEvent = {
  key: string;
  type: "SUMMIT_DISCOVERY" | "MASSIF_COMPLETED";
  summitId?: string;
  summitName?: string;
  altitude?: number;
  massif: string;
  activityId?: string;
  activityTitle?: string | null;
  createdAt: string;
};

const STORAGE_KEY = "montaro.summitCelebrations.v1";
const DASHBOARD_EVENT_KEY = "montaro.summitCelebrations.dashboardEvent.v1";

type StoredCelebrations = {
  initialized: boolean;
  seenEventKeys: string[];
};

function readStoredCelebrations(): StoredCelebrations {
  if (typeof window === "undefined") {
    return {
      initialized: false,
      seenEventKeys: [],
    };
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {
        initialized: false,
        seenEventKeys: [],
      };
    }

    const parsedValue = JSON.parse(rawValue) as Partial<StoredCelebrations>;

    return {
      initialized: Boolean(parsedValue.initialized),
      seenEventKeys: Array.isArray(parsedValue.seenEventKeys)
        ? parsedValue.seenEventKeys.filter(
            (eventKey): eventKey is string => typeof eventKey === "string",
          )
        : [],
    };
  } catch {
    return {
      initialized: false,
      seenEventKeys: [],
    };
  }
}

function writeStoredCelebrations(value: StoredCelebrations) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function getDiscoveryEventKey(summit: SummitView) {
  return `summit-discovery:${summit.id}:${summit.firstActivity?.id ?? "unknown"}`;
}

function getPassageEventKey(summit: SummitView) {
  return `summit-passage:${summit.id}:${summit.latestActivity?.id ?? "unknown"}`;
}

function getMassifEventKey(massif: string, total: number) {
  return `massif-completed:${massif}:${total}`;
}

function getCurrentEventKeys(summits: SummitView[]) {
  const keys = summits.flatMap((summit) => {
    if (!summit.discovered) {
      return [];
    }

    const summitKeys = [getDiscoveryEventKey(summit)];

    if (
      summit.activityCount > 1 &&
      summit.latestActivity &&
      summit.latestActivity.id !== summit.firstActivity?.id
    ) {
      summitKeys.push(getPassageEventKey(summit));
    }

    return summitKeys;
  });

  for (const massif of getMassifProgress(summits)) {
    if (massif.progress === 100) {
      keys.push(getMassifEventKey(massif.massif, massif.total));
    }
  }

  return keys;
}

function persistDashboardEvent(event: SummitCelebrationEvent) {
  window.localStorage.setItem(
    DASHBOARD_EVENT_KEY,
    JSON.stringify({
      ...event,
      dismissed: false,
    }),
  );

  window.dispatchEvent(
    new CustomEvent("montaro:summit-celebration", {
      detail: event,
    }),
  );
}

function buildDiscoveryEvent(summit: SummitView): SummitCelebrationEvent | null {
  if (!summit.firstActivity) {
    return null;
  }

  return {
    key: getDiscoveryEventKey(summit),
    type: "SUMMIT_DISCOVERY",
    summitId: summit.id,
    summitName: summit.name,
    altitude: summit.altitude,
    massif: summit.massif,
    activityId: summit.firstActivity.id,
    activityTitle: summit.firstActivity.title,
    createdAt: new Date().toISOString(),
  };
}

export function SummitCelebrationMonitor() {
  const { data: activities = [] } = useActivities();
  const hasHandledInitialLoad = useRef(false);
  const summits = useMemo(() => getSummitViews(activities), [activities]);

  useEffect(() => {
    if (activities.length === 0 || summits.length === 0) {
      return;
    }

    const storedCelebrations = readStoredCelebrations();
    const seenEventKeys = new Set(storedCelebrations.seenEventKeys);
    const currentEventKeys = getCurrentEventKeys(summits);

    if (!storedCelebrations.initialized && !hasHandledInitialLoad.current) {
      writeStoredCelebrations({
        initialized: true,
        seenEventKeys: Array.from(new Set(currentEventKeys)),
      });
      hasHandledInitialLoad.current = true;
      return;
    }

    hasHandledInitialLoad.current = true;

    for (const summit of summits) {
      if (!summit.discovered) {
        continue;
      }

      const discoveryKey = getDiscoveryEventKey(summit);

      if (!seenEventKeys.has(discoveryKey)) {
        const event = buildDiscoveryEvent(summit);

        if (event) {
          toast.success(`Nouveau sommet découvert — ${summit.name} rejoint votre carnet.`);
          persistDashboardEvent(event);
          seenEventKeys.add(discoveryKey);
          continue;
        }
      }

      const passageKey = getPassageEventKey(summit);
      const hasNewPassage =
        summit.activityCount > 1 &&
        summit.latestActivity &&
        summit.latestActivity.id !== summit.firstActivity?.id &&
        !seenEventKeys.has(passageKey);

      if (hasNewPassage) {
        toast(`Nouveau passage confirmé — ${summit.name}.`);
        seenEventKeys.add(passageKey);
      }
    }

    for (const massif of getMassifProgress(summits)) {
      if (massif.progress !== 100) {
        continue;
      }

      const massifKey = getMassifEventKey(massif.massif, massif.total);

      if (!seenEventKeys.has(massifKey)) {
        toast.success(`Collection ${massif.massif} complétée.`);
        seenEventKeys.add(massifKey);
      }
    }

    writeStoredCelebrations({
      initialized: true,
      seenEventKeys: Array.from(seenEventKeys),
    });
  }, [activities.length, summits]);

  return null;
}

export {
  DASHBOARD_EVENT_KEY as SUMMIT_CELEBRATION_DASHBOARD_EVENT_KEY,
  STORAGE_KEY as SUMMIT_CELEBRATION_STORAGE_KEY,
};
