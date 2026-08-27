import type { SummitView } from "@/lib/summit-discovery";

export type SummitStatusFilter = "DISCOVERED" | "PENDING" | "ALL" | "MISSING";

export type SummitViewMode = "CARDS" | "TABLE";

export type SummitAltitudeFilter = "ALL" | "LOW" | "MID" | "HIGH" | "ALPINE";

export type SummitSortMode =
  | "DISCOVERY"
  | "ALTITUDE_DESC"
  | "ALTITUDE_ASC"
  | "NAME"
  | "PASSES";

export type SummitFilterState = {
  status: SummitStatusFilter;
  viewMode: SummitViewMode;
  searchQuery: string;
  massif: string;
  altitude: SummitAltitudeFilter;
  sort: SummitSortMode;
};

export type SummitCollectionSummary = {
  discoveredCount: number;
  pendingCount: number;
  missingCount: number;
  totalCount: number;
  coveredMassifs: number;
  completedMassifs: number;
  totalPassages: number;
  discoveryProgress: number;
  highestAltitude: number | null;
};

export type SummitVisualSource =
  | {
      kind: "editorial";
      src: string;
      alt: string;
      credit: string;
      creditUrl: string | null;
    }
  | {
      kind: "fallback";
      src: null;
      alt: string;
      credit: "Illustration HOVREN";
      creditUrl: null;
    };

export type SummitCardStatus = "DISCOVERED" | "PENDING" | "MISSING";

export type SummitCardSecondaryInfo =
  | {
      kind: "activity";
      label: string;
    }
  | {
      kind: "metrics";
      label: string;
    }
  | {
      kind: "massif";
      label: string;
    }
  | {
      kind: "distance";
      label: string;
    };

export type SummitCardViewModel = {
  summit: SummitView;
  summitId: string;
  name: string;
  massif: string;
  altitude: string;
  type: string;
  status: SummitCardStatus;
  statusLabel: string;
  isNew: boolean;
  dateLabel: string | null;
  passageLabel: string;
  secondaryInfo: SummitCardSecondaryInfo;
  visual: SummitVisualSource;
  href: string;
  ctaLabel: string;
  pendingDiscoveryId: string | null;
};
