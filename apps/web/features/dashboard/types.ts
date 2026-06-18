import type { LucideIcon } from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

export type StravaStatus = {
  connected: boolean;
  hasSyncedActivities?: boolean;
  syncedActivitiesCount?: number;
};

export type ChartDatum = {
  day: string;
  distance: number;
  elevation: number;
  duration: number;
};

export type BadgeTone =
  | "summit"
  | "fire"
  | "energy"
  | "sunrise"
  | "winter"
  | "rain";

export type BadgeDefinition = {
  title: string;
  icon: LucideIcon;
  unlocked: boolean;
  hint: string;
  unlockedText: string;
  tone: BadgeTone;
};

export type MetricTone = "forest" | "mint" | "sage" | "lime" | "sky";

export type MetricDefinition = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
  trend: string;
  trendTone: "positive" | "negative" | "neutral";
  tone: MetricTone;
};

export type ChartMetric = "distance" | "elevation" | "duration";

export type RecommendationDefinition = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  label: string;
  tone: "success" | "warning";
};

export type GoalSummary = {
  title: string;
  type: string;
};

export type GoalProgressSummary = {
  progress: number;
  current: number;
  target: number;
  remaining: number;
};

export type ActivityWithMedia = SportActivity & {
  imageUrl?: string | null;
  photoUrl?: string | null;
  stravaPhotoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  photoUrls?: readonly string[] | null;
  photos?: unknown;
};
