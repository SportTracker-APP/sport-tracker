import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Trees,
} from "lucide-react";

export type ActivitySportValue =
  | "TRAIL"
  | "RUNNING"
  | "HIKING"
  | "MTB"
  | "GYM";

export type ActivitySportOption = {
  value: ActivitySportValue;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const ACTIVITY_SPORTS: readonly ActivitySportOption[] = [
  {
    value: "TRAIL",
    label: "Trail",
    shortLabel: "Trail",
    description: "Sentiers, dénivelé et terrain technique.",
    icon: Mountain,
  },
  {
    value: "RUNNING",
    label: "Course",
    shortLabel: "Course",
    description: "Route, piste ou footing quotidien.",
    icon: Footprints,
  },
  {
    value: "HIKING",
    label: "Randonnée",
    shortLabel: "Rando",
    description: "Marche sportive et exploration.",
    icon: Trees,
  },
  {
    value: "MTB",
    label: "VTT",
    shortLabel: "VTT",
    description: "Sorties vélo sur chemins et relief.",
    icon: Bike,
  },
  {
    value: "GYM",
    label: "Musculation",
    shortLabel: "Muscu",
    description: "Renforcement et séances en salle.",
    icon: Dumbbell,
  },
];

export function getActivitySport(
  value: string,
): ActivitySportOption {
  return (
    ACTIVITY_SPORTS.find((sport) => sport.value === value) ??
    ACTIVITY_SPORTS[0]
  );
}
