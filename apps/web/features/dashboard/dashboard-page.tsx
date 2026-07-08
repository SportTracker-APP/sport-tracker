"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  Compass,
  Droplets,
  Footprints,
  Gauge,
  HeartPulse,
  Link2,
  MapPinned,
  Mountain,
  Plus,
  Quote,
  Route,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import {
  SUMMIT_CELEBRATION_DASHBOARD_EVENT_KEY,
  type SummitCelebrationEvent,
} from "@/components/summits/summit-celebration-monitor";
import {
  useActivities,
  useMarkPlannedWorkoutCelebrationSeen,
} from "@/hooks/use-activities";
import { useGoals } from "@/hooks/use-goals";
import { useSummitBadges } from "@/hooks/use-summits";
import { api } from "@/lib/api";
import type { Activity as SportActivity } from "@/lib/activities";
import { getBadgeIcon } from "@/lib/badge-icons";
import {
  calculateGoalProgress,
  formatGoalValue,
  getGoalPeriodEndDate,
  selectPrimaryGoal,
} from "@/lib/goal-progress";

import styles from "./dashboard.module.css";
import {
  getDailyRefugeMessage,
  REFUGE_MESSAGES,
} from "./refuge-messages";

type StravaStatus = {
  connected: boolean;
  hasSyncedActivities?: boolean;
  syncedActivitiesCount?: number;
};

type ChartDatum = {
  day: string;
  distance: number;
  elevation: number;
  duration: number;
};

type BadgeTone = "summit" | "fire" | "energy" | "sunrise" | "winter" | "rain";

type BadgeDefinition = {
  title: string;
  icon: LucideIcon;
  unlocked: boolean;
  hint: string;
  unlockedText: string;
  tone: BadgeTone;
};

type MetricTone = "forest" | "mint" | "sage" | "lime" | "sky";

type MetricDefinition = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
  trend: string;
  trendTone: "positive" | "negative" | "neutral";
  tone: MetricTone;
};

type ChartMetric = "distance" | "elevation" | "duration";

type ActivityWithMedia = SportActivity & {
  imageUrl?: string | null;
  photoUrl?: string | null;
  stravaPhotoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  photoUrls?: readonly string[] | null;
  photos?: unknown;
};

const CHART_METRIC_STORAGE_KEY = "montaro.dashboard2.chartMetric";

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function startOfMonth(date: Date) {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), 1);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function getLocalDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getGoalDeadline(goal: unknown) {
  if (!isRecord(goal)) {
    return null;
  }

  if (
    "period" in goal &&
    (goal.period === "WEEKLY" ||
      goal.period === "MONTHLY" ||
      goal.period === "CUSTOM") &&
    "startDate" in goal &&
    "endDate" in goal
  ) {
    return getGoalPeriodEndDate(
      goal as unknown as Parameters<typeof getGoalPeriodEndDate>[0],
    );
  }

  const candidateKeys = [
    "deadline",
    "endDate",
    "targetDate",
    "dueDate",
    "expiresAt",
    "periodEnd",
  ] as const;

  for (const key of candidateKeys) {
    const rawValue = goal[key];

    if (typeof rawValue !== "string" && !(rawValue instanceof Date)) {
      continue;
    }

    const date = rawValue instanceof Date ? new Date(rawValue) : new Date(rawValue);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function formatGoalDeadline(date: Date | null) {
  if (!date) {
    return "Période glissante · 30 jours";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(date);
  deadline.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (deadline.getTime() - today.getTime()) / 86_400_000,
  );
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(deadline);

  if (daysRemaining < 0) {
    return `Échéance dépassée · ${formattedDate}`;
  }

  if (daysRemaining === 0) {
    return "Échéance aujourd’hui";
  }

  if (daysRemaining === 1) {
    return `Échéance demain · ${formattedDate}`;
  }

  return `Échéance le ${formattedDate} · ${daysRemaining} jours`;
}

function formatMonthYear(date: Date) {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMonthName(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
  }).format(date);
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
  }).format(value);
}

function formatDistance(distance: number, maximumFractionDigits = 1) {
  return `${formatNumber(distance, maximumFractionDigits)} km`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${String(remainingMinutes).padStart(2, "0")}`;
}

function formatDayCount(days: number) {
  return `${formatNumber(days)} ${days === 1 ? "jour" : "jours"}`;
}

function formatPace(totalMinutes: number, distanceKm: number) {
  if (distanceKm <= 0) {
    return "—";
  }

  const totalSeconds = Math.round((totalMinutes / distanceKm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

function formatSignedDistance(distance: number) {
  if (distance === 0) {
    return "Stable cette semaine";
  }

  const prefix = distance > 0 ? "+" : "−";
  return `${prefix}${formatDistance(Math.abs(distance), 1)} vs semaine passée`;
}



function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function getSportLabel(activity: SportActivity | null) {
  if (!activity) {
    return "Aucune sortie";
  }

  const labels: Record<string, string> = {
    FITNESS: "Fitness",
    GRAVEL: "Gravel",
    GYM: "Musculation",
    HIKING: "Randonnée",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };

  return labels[activity.sport] ?? "Sport";
}

function getSportIcon(sport: SportActivity["sport"]): LucideIcon {
  if (["MTB", "ROAD_CYCLING", "GRAVEL"].includes(sport)) {
    return Bike;
  }

  if (["TRAIL", "HIKING"].includes(sport)) {
    return Mountain;
  }

  if (["RUNNING", "WALKING"].includes(sport)) {
    return Footprints;
  }

  return Activity;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function findBestPhotoUrl(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  const directUrl = normalizeHttpUrl(value);

  if (directUrl) {
    return directUrl;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUrl = findBestPhotoUrl(item, depth + 1);

      if (nestedUrl) {
        return nestedUrl;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const preferredKeys = [
    "2048",
    "1536",
    "1024",
    "600",
    "large",
    "original",
    "url",
    "imageUrl",
    "photoUrl",
    "coverImageUrl",
    "primary",
    "urls",
  ];

  for (const key of preferredKeys) {
    if (!(key in value)) {
      continue;
    }

    const nestedUrl = findBestPhotoUrl(value[key], depth + 1);

    if (nestedUrl) {
      return nestedUrl;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nestedUrl = findBestPhotoUrl(nestedValue, depth + 1);

    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

function getActivityPhotoUrl(activity: SportActivity) {
  const activityWithMedia = activity as ActivityWithMedia;
  const directCandidates: unknown[] = [
    activityWithMedia.stravaPhotoUrl,
    activityWithMedia.photoUrl,
    activityWithMedia.imageUrl,
    activityWithMedia.coverImageUrl,
    activityWithMedia.thumbnailUrl,
  ];

  for (const candidate of directCandidates) {
    const directUrl = normalizeHttpUrl(candidate);

    if (directUrl) {
      return directUrl;
    }
  }

  if (Array.isArray(activityWithMedia.photoUrls)) {
    for (const candidate of activityWithMedia.photoUrls) {
      const url = normalizeHttpUrl(candidate);

      if (url) {
        return url;
      }
    }
  }

  return findBestPhotoUrl(activityWithMedia.photos);
}

function isChartMetric(value: string | null): value is ChartMetric {
  return value === "distance" || value === "elevation" || value === "duration";
}

function getCompletedActivities(activities: SportActivity[]) {
  return activities
    .filter(
      (activity) =>
        activity.status === "COMPLETED" && !activity.completedActivityId,
    )
    .sort(
      (firstActivity, secondActivity) =>
        new Date(secondActivity.startedAt).getTime() -
        new Date(firstActivity.startedAt).getTime(),
    );
}

function getPendingCelebration(activities: SportActivity[]) {
  return activities
    .filter(
      (activity) =>
        activity.status === "COMPLETED" &&
        Boolean(activity.completedActivityId) &&
        !activity.celebrationSeenAt,
    )
    .sort((firstActivity, secondActivity) => {
      const firstDate = firstActivity.completedAt ?? firstActivity.updatedAt;
      const secondDate = secondActivity.completedAt ?? secondActivity.updatedAt;

      return new Date(secondDate).getTime() - new Date(firstDate).getTime();
    })[0] ?? null;
}

function getActivitiesBetween(
  activities: SportActivity[],
  startDate: Date,
  endDate: Date,
) {
  return activities.filter((activity) => {
    const startedAt = new Date(activity.startedAt);
    return startedAt >= startDate && startedAt <= endDate;
  });
}

function getElevationTotal(activities: SportActivity[]) {
  return activities.reduce(
    (total, activity) => total + (activity.elevationGain || 0),
    0,
  );
}

function isOutdoorActivity(activity: SportActivity) {
  return [
    "RUNNING",
    "TRAIL",
    "HIKING",
    "MTB",
    "ROAD_CYCLING",
    "GRAVEL",
  ].includes(activity.sport);
}

function getDaysSinceLastActivity(activity: SportActivity | null) {
  if (!activity) {
    return null;
  }

  const today = new Date();
  const lastDate = new Date(activity.startedAt);
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000),
  );
}

function calculateCurrentStreak(activities: SportActivity[]) {
  if (activities.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      activities.map((activity) => {
        const date = new Date(activity.startedAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }),
    ),
  ).sort((first, second) => second - first);

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const difference =
      (uniqueDays[index - 1] - uniqueDays[index]) / 86_400_000;

    if (difference !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function getAdventureName(activities: SportActivity[]) {
  const lastOutdoor = activities.find(isOutdoorActivity);

  if (!lastOutdoor) {
    return "un tour du lac ou une montée aux Aravis";
  }

  if (lastOutdoor.sport === "RUNNING") {
    return "la prochaine boucle autour du lac";
  }

  if (["TRAIL", "HIKING"].includes(lastOutdoor.sport)) {
    return "la prochaine ligne de crête";
  }

  return "la prochaine trace à explorer";
}

function SurfaceHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.surfaceHeader}>
      <div>
        <h2 className={styles.surfaceTitle}>{title}</h2>
        <p className={styles.surfaceDescription}>{description}</p>
      </div>
      {action}
    </div>
  );
}

const METRIC_TONE_CLASSES: Record<MetricTone, string> = {
  forest: styles.metricToneForest,
  mint: styles.metricToneMint,
  sage: styles.metricToneSage,
  lime: styles.metricToneLime,
  sky: styles.metricToneSky,
};

const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  summit: styles.badgeToneSummit,
  fire: styles.badgeToneFire,
  energy: styles.badgeToneEnergy,
  sunrise: styles.badgeToneSunrise,
  winter: styles.badgeToneWinter,
  rain: styles.badgeToneRain,
};

function TopographicIllustration({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 120"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 96C26 66 42 72 60 48C77 25 95 22 111 44C124 61 139 58 176 18" />
      <path d="M0 106C24 80 45 89 65 64C83 42 96 41 114 58C129 72 146 70 180 39" />
      <path d="M8 114C34 94 55 101 75 80C93 61 108 60 125 74C140 86 155 83 176 64" />
      <path d="M44 87C61 69 70 55 83 37C96 55 104 67 119 84" />
    </svg>
  );
}

function ForestLineIllustration({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 150"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 138H172" />
      <path d="M34 136V88" />
      <path d="M34 90L16 112H26L12 128H56L42 112H52L34 90Z" />
      <path d="M86 136V56" />
      <path d="M86 58L62 88H75L55 111H70L48 134H124L102 111H117L97 88H110L86 58Z" />
      <path d="M140 136V78" />
      <path d="M140 80L121 103H132L116 122H128L115 136H165L152 122H164L148 103H159L140 80Z" />
      <path d="M18 44C51 18 83 26 107 9C130 -7 153 2 174 18" />
    </svg>
  );
}

function getTraceToneClass(sport: SportActivity["sport"]) {
  if (["MTB", "ROAD_CYCLING", "GRAVEL"].includes(sport)) {
    return styles.traceToneBike;
  }

  if (["TRAIL", "HIKING"].includes(sport)) {
    return styles.traceToneMountain;
  }

  if (["RUNNING", "WALKING"].includes(sport)) {
    return styles.traceToneRun;
  }

  return styles.traceToneDefault;
}

function MetricCard({ metric }: { metric: MetricDefinition }) {
  const Icon = metric.icon;
  const trendClass =
    metric.trendTone === "positive"
      ? styles.metricTrendPositive
      : metric.trendTone === "negative"
        ? styles.metricTrendNegative
        : styles.metricTrendNeutral;

  return (
    <div
      className={`${styles.metricCard} ${METRIC_TONE_CLASSES[metric.tone]} ${
        metric.featured ? styles.metricFeatured : ""
      }`}
    >
      <div className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </div>
      <div className={styles.metricContent}>
        <p className={styles.metricLabel}>{metric.title}</p>
        <p className={styles.metricValue}>{metric.value}</p>
        <p className={styles.metricDescription}>{metric.description}</p>
        <span className={`${styles.metricTrend} ${trendClass}`}>{metric.trend}</span>
      </div>
    </div>
  );
}

function ActivityChart({
  data,
  metric,
}: {
  data: ChartDatum[];
  metric: ChartMetric;
}) {
  const configuration = {
    distance: {
      dataKey: "distance",
      label: "Distance (km)",
      color: "var(--chart-distance)",
      gradientId: "distanceGradient",
    },
    elevation: {
      dataKey: "elevation",
      label: "Dénivelé positif (m)",
      color: "var(--chart-elevation)",
      gradientId: "elevationGradient",
    },
    duration: {
      dataKey: "duration",
      label: "Durée (h)",
      color: "var(--chart-duration)",
      gradientId: "durationGradient",
    },
  } as const;
  const selected = configuration[metric];

  return (
    <div className={styles.chartArea}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-distance-start)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--chart-distance-end)" stopOpacity={0.58} />
            </linearGradient>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-elevation-start)" stopOpacity={0.94} />
              <stop offset="100%" stopColor="var(--chart-elevation-end)" stopOpacity={0.56} />
            </linearGradient>
            <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-duration-start)" stopOpacity={0.34} />
              <stop offset="100%" stopColor="var(--chart-duration-end)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            interval={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "var(--chart-cursor)" }}
            contentStyle={{
              borderRadius: 18,
              border: "1px solid var(--chart-tooltip-border)",
              background: "var(--chart-tooltip-background)",
              boxShadow: "var(--chart-tooltip-shadow)",
              fontSize: 12,
              padding: "10px 12px",
            }}
            labelStyle={{ color: "var(--chart-tooltip-title)", fontWeight: 700 }}
            itemStyle={{ color: selected.color, fontWeight: 700 }}
          />
          {metric === "duration" ? (
            <>
              <Area
                type="monotone"
                dataKey={selected.dataKey}
                name={selected.label}
                stroke="none"
                fill={`url(#${selected.gradientId})`}
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey={selected.dataKey}
                name={selected.label}
                stroke={selected.color}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: selected.color,
                  stroke: "var(--chart-active-dot-ring)",
                  strokeWidth: 2,
                }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </>
          ) : (
            <Bar
              dataKey={selected.dataKey}
              name={selected.label}
              fill={`url(#${selected.gradientId})`}
              radius={[9, 9, 3, 3]}
              maxBarSize={22}
              isAnimationActive
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function RecentTraceList({
  activities,
  totalCount,
}: {
  activities: SportActivity[];
  totalCount: number;
}) {
  if (activities.length === 0) {
    return <div className={styles.emptyState}>Aucune activité récente à afficher.</div>;
  }

  return (
    <div className={styles.traceCollection}>
      <div className={styles.traceList}>
        {activities.map((activity) => {
          const Icon = getSportIcon(activity.sport);
          const photoUrl = getActivityPhotoUrl(activity);

          return (
            <Link
              key={activity.id}
              href={`/activites/${activity.id}`}
              className={styles.traceItem}
            >
              <div
                className={`${styles.traceThumbnail} ${getTraceToneClass(activity.sport)} ${
                  photoUrl ? styles.traceThumbnailHasPhoto : ""
                }`}
                style={
                  photoUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, var(--trace-photo-overlay-start), var(--trace-photo-overlay-end)), url(${JSON.stringify(
                          photoUrl,
                        )})`,
                      }
                    : undefined
                }
              >
                {!photoUrl ? (
                  <>
                    <span className={styles.traceThumbnailSun} />
                    <span className={styles.traceThumbnailRidge} />
                  </>
                ) : null}
                <Icon aria-hidden="true" />
              </div>
              <div className={styles.traceContent}>
                <div className={styles.traceTitleRow}>
                  <span className={styles.traceSport}>{getSportLabel(activity)}</span>
                  <p className={styles.traceTitle}>{activity.title}</p>
                </div>
                <p className={styles.traceMeta}>
                  {formatShortDate(activity.startedAt)}
                  <span>•</span>
                  {formatDistance(activity.distance || 0, 1)}
                  <span>•</span>
                  {formatDuration(activity.duration)}
                </p>
              </div>
              <ChevronRight className={styles.traceArrow} aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <Link href="/activites" className={styles.traceFooter}>
        <span>
          {activities.length} {activities.length === 1 ? "dernière sortie" : "dernières sorties"}
          {totalCount > activities.length ? ` · ${totalCount} au total` : ""}
        </span>
        <strong>Voir l’historique</strong>
        <ChevronRight aria-hidden="true" />
      </Link>
    </div>
  );
}

function GoalRing({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={styles.goalRingShell}>
      <div
        className={styles.goalRing}
        style={{
          background: `conic-gradient(var(--goal-ring-active) 0 ${safeProgress}%, var(--goal-ring-track) ${safeProgress}% 100%)`,
        }}
      >
        <div className={styles.goalRingInner}>{safeProgress}%</div>
      </div>
    </div>
  );
}

function ExplorationHeatmap({ activities }: { activities: SportActivity[] }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const gridStart = startOfWeek(monthStart);
  const displayedDayCount = 28;
  const monthEndDay = Math.min(
    displayedDayCount,
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  );

  const activitiesByDay = new Map<string, SportActivity[]>();

  activities.forEach((activity) => {
    const key = getLocalDateKey(activity.startedAt);
    const dayActivities = activitiesByDay.get(key) ?? [];
    dayActivities.push(activity);
    activitiesByDay.set(key, dayActivities);
  });

  const cells = Array.from({ length: displayedDayCount }, (_, index) => {
    const day = addDays(gridStart, index);
    const isCurrentMonth = day.getMonth() === now.getMonth();
    const isInsideDisplayedMonthRange =
      isCurrentMonth && day.getDate() >= 1 && day.getDate() <= monthEndDay;
    const dayActivities = isInsideDisplayedMonthRange
      ? activitiesByDay.get(getLocalDateKey(day)) ?? []
      : [];
    const totalDuration = dayActivities.reduce(
      (total, activity) => total + activity.duration,
      0,
    );
    const intensity =
      dayActivities.length === 0
        ? 0
        : totalDuration < 45
          ? 1
          : totalDuration < 120
            ? 2
            : 3;
    const firstActivity = dayActivities[0] ?? null;
    const Icon = firstActivity ? getSportIcon(firstActivity.sport) : null;
    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(day);

    return {
      id: getLocalDateKey(day),
      day,
      intensity,
      Icon,
      activityId: firstActivity?.id ?? null,
      isInsideDisplayedMonthRange,
      title:
        dayActivities.length > 0
          ? `${formattedDate} — ${dayActivities.length} ${dayActivities.length === 1 ? "sortie" : "sorties"}`
          : formattedDate,
    };
  });

  return (
    <div className={styles.heatmap}>
      <div className={styles.heatmapWeekdays}>
        {["LU", "MA", "ME", "JE", "VE", "SA", "DI"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles.heatmapBody}>
        {[0, 1, 2, 3].map((week) => (
          <div className={styles.heatmapRow} key={week}>
            <span className={styles.heatmapWeek}>S{week + 1}</span>
            {cells.slice(week * 7, week * 7 + 7).map((cell) => {
              const Icon = cell.Icon;
              const cellClassName = `${styles.heatmapCell} ${styles[`heatmapLevel${cell.intensity}`]} ${
                cell.isInsideDisplayedMonthRange
                  ? ""
                  : styles.heatmapOutsideMonth
              }`;
              const cellContent = Icon ? <Icon aria-hidden="true" /> : null;

              if (cell.activityId) {
                return (
                  <Link
                    className={cellClassName}
                    href={`/activites/${cell.activityId}`}
                    key={cell.id}
                    title={cell.title}
                    aria-label={`${cell.title}. Ouvrir la fiche de l’activité.`}
                  >
                    {cellContent}
                  </Link>
                );
              }

              return (
                <div
                  className={cellClassName}
                  key={cell.id}
                  title={cell.title}
                  aria-label={cell.title}
                >
                  {cellContent}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Charge réelle par jour</span>
        <span><i className={styles.legendRest} />Repos</span>
        <span><i className={styles.legendLow} />Courte</span>
        <span><i className={styles.legendMedium} />Soutenue</span>
        <span><i className={styles.legendHigh} />Longue</span>
      </div>
    </div>
  );
}

function StravaConnectionCard({ compact }: { compact: boolean }) {
  return (
    <div
      className={`${styles.stravaConnectionCard} ${
        compact ? styles.stravaConnectionCardCompact : ""
      }`}
    >
      <div className={styles.emptyDashboardIcon}><Link2 aria-hidden="true" /></div>
      <div className={styles.stravaConnectionContent}>
        <p className={styles.emptyDashboardKicker}>Strava non synchronisé</p>
        <h2>Synchronisez automatiquement tes sorties avec Strava</h2>
        <p>
          Montaro fonctionne aussi avec tes activités ajoutées manuellement.
        </p>
      </div>
      <div className={styles.emptyDashboardActions}>
        <Link href="/integrations/strava" className={styles.primaryButton}>
          <Link2 aria-hidden="true" /> Connecter Strava
        </Link>
        <Link href="/activites/nouvelle" className={styles.secondaryButton}>
          <Plus aria-hidden="true" /> Ajouter une activité
        </Link>
      </div>
    </div>
  );
}

function PlannedWorkoutCelebrationCard({
  plannedWorkout,
  onHide,
  isHiding,
}: {
  plannedWorkout: SportActivity;
  onHide: () => void;
  isHiding: boolean;
}) {
  const completedActivity = plannedWorkout.completedActivity;

  if (!completedActivity) {
    return null;
  }

  return (
    <FadeIn delay={0.04}>
      <section className={styles.celebrationCard} role="status">
        <div className={styles.celebrationIcon}>
          <CheckCircle2 aria-hidden="true" />
        </div>
        <div className={styles.celebrationContent}>
          <p className={styles.celebrationKicker}>Sortie accomplie</p>
          <h2>{plannedWorkout.title ?? "Séance planifiée terminée"}</h2>
          <p>Vous aviez prévu cette sortie. Vous l’avez réalisée.</p>
          <div className={styles.celebrationMetrics}>
            <span>{getSportLabel(completedActivity)}</span>
            <span>{formatDistance(completedActivity.distance || 0, 1)}</span>
            <span>{formatDuration(completedActivity.duration)}</span>
            {completedActivity.elevationGain ? (
              <span>{formatNumber(completedActivity.elevationGain)} m D+</span>
            ) : null}
          </div>
        </div>
        <div className={styles.celebrationActions}>
          <Link
            href={`/activites/${completedActivity.id}`}
            className={styles.celebrationPrimaryAction}
          >
            Voir l’activité
          </Link>
          <button
            type="button"
            className={styles.celebrationHideAction}
            onClick={onHide}
            disabled={isHiding}
          >
            <X aria-hidden="true" />
            Masquer
          </button>
        </div>
      </section>
    </FadeIn>
  );
}

type StoredDashboardSummitEvent = SummitCelebrationEvent & {
  dismissed?: boolean;
  shownAt?: string;
};

function readDashboardSummitEvent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      SUMMIT_CELEBRATION_DASHBOARD_EVENT_KEY,
    );

    if (!rawValue) {
      return null;
    }

    const event = JSON.parse(rawValue) as StoredDashboardSummitEvent;

    if (
      event.type !== "SUMMIT_DISCOVERY" ||
      event.dismissed ||
      !event.summitName
    ) {
      return null;
    }

    return event;
  } catch {
    return null;
  }
}

function markDashboardSummitEventRead(event: StoredDashboardSummitEvent) {
  window.localStorage.setItem(
    SUMMIT_CELEBRATION_DASHBOARD_EVENT_KEY,
    JSON.stringify({
      ...event,
      shownAt: event.shownAt ?? new Date().toISOString(),
    }),
  );
}

function dismissDashboardSummitEvent(event: StoredDashboardSummitEvent) {
  window.localStorage.setItem(
    SUMMIT_CELEBRATION_DASHBOARD_EVENT_KEY,
    JSON.stringify({
      ...event,
      dismissed: true,
      shownAt: event.shownAt ?? new Date().toISOString(),
    }),
  );
}

function SummitDiscoveryCelebrationCard({
  event,
  onHide,
}: {
  event: StoredDashboardSummitEvent;
  onHide: () => void;
}) {
  return (
    <FadeIn delay={0.04}>
      <section
        className={`${styles.celebrationCard} ${styles.summitCelebrationCard}`}
        role="status"
        data-summit-celebration="true"
      >
        <div className={`${styles.celebrationIcon} ${styles.summitCelebrationIcon}`}>
          <Mountain aria-hidden="true" />
        </div>
        <div className={`${styles.celebrationContent} ${styles.summitCelebrationContent}`}>
          <p className={`${styles.celebrationKicker} ${styles.summitCelebrationKicker}`}>
            Nouveau sommet
          </p>
          <h2>{event.summitName}</h2>
          <p>
            {event.activityTitle
              ? `Ajoutée à ton carnet lors de ta sortie « ${event.activityTitle} ».`
              : "Ajoutée à ton carnet lors de ta dernière sortie."}
          </p>
          <div className={`${styles.celebrationMetrics} ${styles.summitCelebrationMetrics}`}>
            {typeof event.altitude === "number" ? (
              <span>
                {formatNumber(event.altitude).replace(/\u202f/g, "\u00a0")} m
              </span>
            ) : null}
            <span>{event.massif}</span>
          </div>
        </div>
        <div className={`${styles.celebrationActions} ${styles.summitCelebrationActions}`}>
          <Link
            href="/sommets"
            className={`${styles.celebrationPrimaryAction} ${styles.summitCelebrationPrimaryAction}`}
            onClick={onHide}
          >
            Voir le sommet
          </Link>
          <button
            type="button"
            className={`${styles.celebrationHideAction} ${styles.summitCelebrationHideAction}`}
            onClick={onHide}
            aria-label="Masquer la notification"
            aria-describedby="summit-notification-dismiss-tooltip"
          >
            <X aria-hidden="true" />
            <span
              id="summit-notification-dismiss-tooltip"
              role="tooltip"
              className={styles.summitCelebrationTooltip}
            >
              Masquer la notification
            </span>
          </button>
        </div>
      </section>
    </FadeIn>
  );
}

export default function DashboardPage() {
  const { data: activities = [], isLoading, error } = useActivities();
  const { data: goals = [] } = useGoals();
  const { data: summitBadges = [] } = useSummitBadges();
  const markCelebrationSeen = useMarkPlannedWorkoutCelebrationSeen();
  const [stravaStatus, setStravaStatus] = useState<StravaStatus | null>(null);
  const [isLoadingStravaStatus, setIsLoadingStravaStatus] = useState(true);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("distance");
  const [refugeMessage, setRefugeMessage] = useState(REFUGE_MESSAGES[0]);
  const [summitCelebrationEvent, setSummitCelebrationEvent] =
    useState<StoredDashboardSummitEvent | null>(null);

  useEffect(() => {
    const storedMetric = window.localStorage.getItem(CHART_METRIC_STORAGE_KEY);

    if (isChartMetric(storedMetric)) {
      setChartMetric(storedMetric);
    }
  }, []);

  useEffect(() => {
    setRefugeMessage(getDailyRefugeMessage(new Date()));
  }, []);

  useEffect(() => {
    const storedEvent = readDashboardSummitEvent();

    if (storedEvent) {
      setSummitCelebrationEvent(storedEvent);
      markDashboardSummitEventRead(storedEvent);
    }

    function handleSummitCelebration(event: Event) {
      const customEvent = event as CustomEvent<SummitCelebrationEvent>;
      const celebrationEvent = customEvent.detail;

      if (
        celebrationEvent?.type !== "SUMMIT_DISCOVERY" ||
        !celebrationEvent.summitName
      ) {
        return;
      }

      setSummitCelebrationEvent(celebrationEvent);
      markDashboardSummitEventRead(celebrationEvent);
    }

    window.addEventListener(
      "montaro:summit-celebration",
      handleSummitCelebration,
    );

    return () => {
      window.removeEventListener(
        "montaro:summit-celebration",
        handleSummitCelebration,
      );
    };
  }, []);

  const handleChartMetricChange = (metric: ChartMetric) => {
    setChartMetric(metric);
    window.localStorage.setItem(CHART_METRIC_STORAGE_KEY, metric);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStravaStatus() {
      try {
        const { data } = await api.get<StravaStatus>("/strava/status");
        if (isMounted) {
          setStravaStatus(data);
        }
      } catch {
        if (isMounted) {
          setStravaStatus({
            connected: false,
            hasSyncedActivities: false,
            syncedActivitiesCount: 0,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingStravaStatus(false);
        }
      }
    }

    void loadStravaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);
    const previousWeekStart = addDays(weekStart, -7);
    const previousWeekEnd = addDays(weekStart, -1);
    previousWeekEnd.setHours(23, 59, 59, 999);
    const monthStart = startOfMonth(now);
    const monthEnd = new Date(now);
    monthEnd.setHours(23, 59, 59, 999);
    const rollingPeriodStart = addDays(now, -30);
    rollingPeriodStart.setHours(0, 0, 0, 0);
    const rollingPeriodEnd = new Date(now);
    rollingPeriodEnd.setHours(23, 59, 59, 999);

    const completedActivities = getCompletedActivities(activities);
    const weekActivities = getActivitiesBetween(completedActivities, weekStart, weekEnd);
    const previousWeekActivities = getActivitiesBetween(
      completedActivities,
      previousWeekStart,
      previousWeekEnd,
    );
    const currentMonthActivities = getActivitiesBetween(
      completedActivities,
      monthStart,
      monthEnd,
    );
    const rollingActivities = getActivitiesBetween(
      completedActivities,
      rollingPeriodStart,
      rollingPeriodEnd,
    );

    const weeklyDistance = weekActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const previousWeeklyDistance = previousWeekActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const currentMonthDistance = currentMonthActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const currentMonthElevation = getElevationTotal(currentMonthActivities);
    const rollingDistance = rollingActivities.reduce(
      (total, activity) => total + (activity.distance || 0),
      0,
    );
    const rollingDuration = rollingActivities.reduce(
      (total, activity) => total + activity.duration,
      0,
    );
    const rollingElevation = getElevationTotal(rollingActivities);
    const activeDays = new Set(
      rollingActivities.map((activity) =>
        new Date(activity.startedAt).toDateString(),
      ),
    ).size;
    const bestActivity = rollingActivities.reduce<SportActivity | null>(
      (currentBest, activity) => {
        if (!currentBest) {
          return activity;
        }

        return (activity.distance || 0) > (currentBest.distance || 0)
          ? activity
          : currentBest;
      },
      null,
    );
    const currentMonthBestActivity =
      currentMonthActivities.reduce<SportActivity | null>(
        (currentBest, activity) => {
          if (!currentBest) {
            return activity;
          }

          return (activity.distance || 0) > (currentBest.distance || 0)
            ? activity
            : currentBest;
        },
        null,
      );
    const exploredSectors = completedActivities.filter(
      (activity) =>
        isOutdoorActivity(activity) &&
        ((activity.elevationGain || 0) >= 250 ||
          ["RUNNING", "TRAIL", "HIKING"].includes(activity.sport)),
    ).length;
    const chartData: ChartDatum[] = Array.from({ length: 31 }, (_, index) => {
      const day = addDays(rollingPeriodStart, index);
      const dayActivities = rollingActivities.filter((activity) =>
        isSameDay(new Date(activity.startedAt), day),
      );

      return {
        day: new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }).format(day),
        distance: Number(
          dayActivities
            .reduce((total, activity) => total + (activity.distance || 0), 0)
            .toFixed(2),
        ),
        elevation: Math.round(getElevationTotal(dayActivities)),
        duration: Number(
          (
            dayActivities.reduce(
              (total, activity) => total + activity.duration,
              0,
            ) / 60
          ).toFixed(2),
        ),
      };
    });

    return {
      completedActivities,
      weekActivities,
      rollingActivities,
      currentMonthActivities,
      weeklyDistance,
      previousWeeklyDistance,
      currentMonthDistance,
      currentMonthElevation,
      rollingDistance,
      rollingDuration,
      rollingElevation,
      activeDays,
      bestActivity,
      currentMonthBestActivity,
      latestActivity: completedActivities[0] ?? null,
      recentActivities: completedActivities.slice(0, 4),
      exploredSectors,
      currentStreak: calculateCurrentStreak(completedActivities),
      chartData,
      heatmapMonthLabel: formatMonthYear(now),
      heatmapDescription: `Données réelles du 1er au ${Math.min(
        28,
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      )} ${formatMonthName(now)}.`,
    };
  }, [activities]);

  const primaryGoal = useMemo(() => selectPrimaryGoal(goals), [goals]);
  const goalProgress = useMemo(
    () => calculateGoalProgress(primaryGoal, dashboardData.completedActivities),
    [dashboardData.completedActivities, primaryGoal],
  );
  const goalCurrentLabel = formatGoalValue(goalProgress.current, primaryGoal.type);
  const goalTargetLabel = formatGoalValue(goalProgress.target, primaryGoal.type);
  const goalRemainingLabel = formatGoalValue(goalProgress.remaining, primaryGoal.type);
  const isGoalCompleted = goalProgress.remaining <= 0;
  const goalDeadline = useMemo(
    () => getGoalDeadline(primaryGoal),
    [primaryGoal],
  );
  const goalDeadlineLabel = formatGoalDeadline(goalDeadline);
  const hasStravaIntegration =
    Boolean(stravaStatus?.connected) ||
    Boolean(stravaStatus?.hasSyncedActivities) ||
    dashboardData.completedActivities.some((activity) =>
      Boolean(activity.stravaActivityId),
    );
  const hasAnyActivity = dashboardData.completedActivities.length > 0;
  const pendingCelebration = useMemo(
    () => getPendingCelebration(activities),
    [activities],
  );
  const showStravaConnectionCard =
    !isLoadingStravaStatus && !hasStravaIntegration;
  const weeklyDelta =
    dashboardData.weeklyDistance - dashboardData.previousWeeklyDistance;
  const nextAdventure = getAdventureName(dashboardData.completedActivities);
  const daysSinceLastActivity = getDaysSinceLastActivity(
    dashboardData.latestActivity,
  );
  const unlockedBadges: BadgeDefinition[] = summitBadges.map((badge) => ({
    title: badge.name,
    icon: getBadgeIcon(badge.icon),
    unlocked: badge.unlocked,
    hint: badge.hint,
    unlockedText: badge.description,
    tone: badge.tone,
  }));
  const unlockedBadgesCount = unlockedBadges.filter(
    (badge) => badge.unlocked,
  ).length;
  const badgePreview = unlockedBadges
    .slice()
    .sort((firstBadge, secondBadge) =>
      firstBadge.unlocked === secondBadge.unlocked
        ? 0
        : firstBadge.unlocked
          ? -1
          : 1,
    )
    .slice(0, 6);
  const averageElevation =
    dashboardData.rollingActivities.length > 0
      ? dashboardData.rollingElevation / dashboardData.rollingActivities.length
      : 0;
  const metrics: MetricDefinition[] = [
    {
      title: "Sorties",
      value: formatNumber(dashboardData.currentMonthActivities.length),
      description: "Mois actuel",
      icon: Footprints,
      featured: true,
      trend:
        dashboardData.activeDays > 0
          ? `${formatDayCount(dashboardData.activeDays)} actifs sur 30`
          : "Première sortie à planifier",
      trendTone: dashboardData.activeDays > 0 ? "positive" : "neutral",
      tone: "forest",
    },
    {
      title: "Distance",
      value: formatDistance(dashboardData.currentMonthDistance, 0),
      description: "Mois actuel",
      icon: Route,
      trend: dashboardData.currentMonthBestActivity
        ? `Sortie record : ${formatDistance(
            dashboardData.currentMonthBestActivity.distance || 0,
            1,
          )}`
        : "Le terrain vous attend",
      trendTone: dashboardData.currentMonthBestActivity
        ? "positive"
        : "neutral",
      tone: "mint",
    },
    {
      title: "D+",
      value: `${formatNumber(dashboardData.currentMonthElevation)} m`,
      description: "Mois actuel",
      icon: Mountain,
      trend:
        dashboardData.rollingActivities.length > 0
          ? `Moy. ${formatNumber(averageElevation)} m / sortie`
          : "Prochain sommet à choisir",
      trendTone: dashboardData.rollingActivities.length > 0 ? "positive" : "neutral",
      tone: "sage",
    },
    {
      title: "Cap",
      value: `${goalProgress.progress}%`,
      description: "Progression actuelle",
      icon: HeartPulse,
      trend:
        goalProgress.progress >= 100
          ? "Objectif validé"
          : goalProgress.progress >= 80
            ? "Dernière ligne droite"
            : `Encore ${goalRemainingLabel}`,
      trendTone: goalProgress.progress >= 80 ? "positive" : "neutral",
      tone: "lime",
    },
    {
      title: "Série",
      value: formatDayCount(dashboardData.currentStreak),
      description: "Régularité actuelle",
      icon: CircleGauge,
      trend:
        daysSinceLastActivity === null
          ? "Première sortie à planifier"
          : daysSinceLastActivity === 0
            ? "Sortie enregistrée aujourd’hui"
            : `Dernière sortie il y a ${formatDayCount(daysSinceLastActivity)}`,
      trendTone:
        daysSinceLastActivity !== null && daysSinceLastActivity <= 2
          ? "positive"
          : "neutral",
      tone: "sky",
    },
  ];


  const recommendations = [
    {
      title: hasStravaIntegration ? "Strava synchronisé" : "Strava à connecter",
      description: hasStravaIntegration
        ? "Les données du dashboard sont alimentées automatiquement."
        : "Le dashboard utilise encore tes activités manuelles.",
      icon: hasStravaIntegration ? CheckCircle2 : AlertTriangle,
      href: "/integrations/strava",
      label: hasStravaIntegration ? "OK" : "Connecter",
      tone: "success",
    },
    {
      title: isGoalCompleted
        ? "Objectif validé"
        : goalProgress.progress >= 80
          ? "Objectif à portée"
          : "Cap encore ouvert",
      description:
        isGoalCompleted
          ? "Ce cap est terminé pour la période en cours."
          : goalProgress.progress >= 80
          ? "Vous êtes dans la dernière ligne droite des 30 jours."
          : `${goalRemainingLabel} restent à aller chercher.`,
      icon: Target,
      href: "/objectifs",
      label: isGoalCompleted
        ? "Voir les défis"
        : goalProgress.progress >= 80
          ? "Continue comme ça !"
          : "Voir le cap",
      tone: "success",
    },
    {
      title: weeklyDelta >= 0 ? "Semaine solide" : "Semaine plus calme",
      description:
        weeklyDelta >= 0
          ? formatSignedDistance(weeklyDelta)
          : "Une sortie courte peut relancer le rythme.",
      icon: weeklyDelta >= 0 ? ArrowUpRight : Gauge,
      href: "/calendrier",
      label: weeklyDelta >= 0 ? "Bien joué" : "Planifie une sortie",
      tone: weeklyDelta >= 0 ? "success" : "warning",
    },
    {
      title: "Hydratation & récup",
      description: "Pense à t’hydrater et à bien récupérer après les efforts.",
      icon: Droplets,
      href: "/journal",
      label: "Bon réflexe",
      tone: "success",
    },
  ] as const;

  return (
    <DashboardLayout>
      <div className={styles.dashboardPage} data-dashboard-theme="adaptive">
        {isLoading ? (
          <div className={styles.loadingState}>Chargement de ton dashboard…</div>
        ) : null}

        {error ? (
          <div className={styles.errorState}>
            Impossible de charger les activités pour le moment.
          </div>
        ) : null}

        <>
          {showStravaConnectionCard ? (
            <StravaConnectionCard compact={hasAnyActivity} />
          ) : null}

          {pendingCelebration ? (
            <PlannedWorkoutCelebrationCard
              plannedWorkout={pendingCelebration}
              isHiding={markCelebrationSeen.isPending}
              onHide={() => {
                markCelebrationSeen.mutate(pendingCelebration.id);
              }}
            />
          ) : null}

          {summitCelebrationEvent ? (
            <SummitDiscoveryCelebrationCard
              event={summitCelebrationEvent}
              onHide={() => {
                dismissDashboardSummitEvent(summitCelebrationEvent);
                setSummitCelebrationEvent(null);
              }}
            />
          ) : null}

            <FadeIn delay={0.1}>
              <div className={styles.hero}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                  <div className={styles.heroCopy}>
                    <div className={styles.heroKicker}>
                      <Zap aria-hidden="true" />
                      Carnet d’exploration
                    </div>
                    <h1>
                      Bienvenue dans ton refuge <span>outdoor.</span>
                    </h1>
                    <p>
                      {formatNumber(dashboardData.exploredSectors)} secteurs run,
                      trail ou montagne découverts. {formatDistance(
                        dashboardData.rollingDistance,
                        1,
                      )} parcourus et {formatNumber(
                        dashboardData.rollingElevation,
                      )} m D+ gravis sur tes 30 derniers jours.
                    </p>
                    <p>
                      Prochaine aventure : {nextAdventure}. Un terrain de jeu pour
                      courir, grimper, rouler, marcher, et garder le fil.
                    </p>

                    <div className={styles.heroActions}>
                      <Link href="/activites/nouvelle" className={styles.heroPrimaryButton}>
                        <Plus aria-hidden="true" /> Tracer une sortie
                      </Link>
                      <Link href="/integrations/strava" className={styles.heroStravaButton}>
                        <Link2 aria-hidden="true" /> Synchroniser Strava
                      </Link>
                      <Link href="/calendrier" className={styles.heroGhostButton}>
                        <CalendarDays aria-hidden="true" /> Planifier
                      </Link>
                    </div>

                    <div className={styles.heroMiniStats}>
                      <div>
                        <span><Mountain aria-hidden="true" /> D+ 30j</span>
                        <strong>{formatNumber(dashboardData.rollingElevation)} m</strong>
                      </div>
                      <div>
                        <span><Trophy aria-hidden="true" /> Progression</span>
                        <strong>{goalProgress.progress}%</strong>
                      </div>
                      <div>
                        <span>
                          <Compass aria-hidden="true" />{" "}
                          {primaryGoal.type === "DISTANCE_KM"
                            ? "Reste à parcourir"
                            : "Reste à accomplir"}
                        </span>
                        <strong>
                          {goalProgress.remaining > 0
                            ? goalRemainingLabel
                            : "Validé"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.heroGoalCard}>
                    <div className={styles.heroGoalTopline}>
                      <div className={styles.heroGoalIcon}>
                        <Trophy aria-hidden="true" />
                      </div>
                      <div className={styles.heroGoalBadge}>
                        <Mountain aria-hidden="true" />
                      </div>
                    </div>
                    <p className={styles.heroGoalKicker}>Cap en cours</p>
                    <h2>{primaryGoal.title}</h2>
                    <p className={styles.heroGoalText}>
                      {isGoalCompleted
                        ? `${goalCurrentLabel} validés sur ${goalTargetLabel}. Objectif atteint pour cette période.`
                        : `${goalCurrentLabel} déjà validés sur ${goalTargetLabel}. Encore ${goalRemainingLabel} à aller chercher sans dramatiser. Enfin… un peu.`}
                    </p>
                    <div className={styles.heroProgressHeader}>
                      <span>Progression</span>
                      <strong>{goalProgress.progress}%</strong>
                    </div>
                    <div className={styles.heroProgressTrack}>
                      <div style={{ width: `${Math.min(100, goalProgress.progress)}%` }} />
                    </div>
                    <div className={styles.heroLastTrace}>
                      <p><MapPinned aria-hidden="true" /> Dernière trace</p>
                      <strong>
                        {dashboardData.latestActivity?.title ?? "Aucune sortie récente"}
                      </strong>
                      <span>
                        {getSportLabel(dashboardData.latestActivity)}
                        {dashboardData.latestActivity ? (
                          <>
                            <i>•</i>{formatDistance(dashboardData.latestActivity.distance || 0, 1)}
                            <i>•</i>{formatShortDate(dashboardData.latestActivity.startedAt)}
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className={styles.metricsGrid}>
              {metrics.map((metric, index) => (
                <FadeIn key={metric.title} delay={0.14 + index * 0.05}>
                  <MetricCard metric={metric} />
                </FadeIn>
              ))}
            </div>

            <div className={styles.dashboardGrid}>
              <div className={styles.activityPanelWrap}>
                <FadeIn delay={0.22}>
                <div className={`${styles.surface} ${styles.activityPanel}`}>
                  <SurfaceHeader
                    title="Activité sur les 30 derniers jours"
                    description="Tes sorties réelles, jour par jour."
                    action={
                      <button type="button" className={styles.rangeButton}>
                        30 derniers jours <ChevronDown aria-hidden="true" />
                      </button>
                    }
                  />
                  <div className={styles.chartSummary}>
                    <div><span>Total</span><strong>{formatDistance(dashboardData.rollingDistance, 1)}</strong></div>
                    <div><span>Durée</span><strong>{formatDuration(dashboardData.rollingDuration)}</strong></div>
                    <div><span>D+</span><strong>{formatNumber(dashboardData.rollingElevation)} m</strong></div>
                  </div>
                  <div className={styles.chartToolbar}>
                    <div className={styles.chartTabs} role="tablist" aria-label="Métrique du graphique">
                      {([
                        ["distance", "Distance"],
                        ["elevation", "Dénivelé"],
                        ["duration", "Durée"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="tab"
                          aria-selected={chartMetric === value}
                          className={chartMetric === value ? styles.chartTabActive : ""}
                          onClick={() => handleChartMetricChange(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <span className={styles.chartUnit}>
                      {chartMetric === "distance"
                        ? "Kilomètres"
                        : chartMetric === "elevation"
                          ? "Mètres de D+"
                          : "Heures d’activité"}
                    </span>
                  </div>
                  <ActivityChart data={dashboardData.chartData} metric={chartMetric} />
                  <div className={styles.chartInsight}>
                    <Mountain aria-hidden="true" />
                    Ta meilleure trace sur la période atteint
                    <strong>
                      {dashboardData.bestActivity
                        ? formatDistance(dashboardData.bestActivity.distance || 0, 1)
                        : "0 km"}
                    </strong>
                  </div>
                </div>
              </FadeIn>
              </div>

              <div className={styles.tracesPanelWrap}>
                <FadeIn delay={0.28}>
                <div className={`${styles.surface} ${styles.tracesPanel}`}>
                  <SurfaceHeader
                    title="Dernières traces"
                    description="Les sorties qui construisent ton terrain de jeu."
                  />
                  <RecentTraceList
                    activities={dashboardData.recentActivities}
                    totalCount={dashboardData.completedActivities.length}
                  />
                </div>
              </FadeIn>
              </div>

              <div className={styles.goalPanelWrap}>
                <FadeIn delay={0.34}>
                <div className={`${styles.surface} ${styles.goalPanel}`}>
                  <div className={styles.goalPanelHeader}>
                    <h2>Objectif en cours</h2>
                    <Link href="/objectifs">Modifier</Link>
                  </div>
                  <div className={styles.goalPanelContent}>
                    <GoalRing progress={goalProgress.progress} />
                    <div className={styles.goalPanelCopy}>
                      <h3>{primaryGoal.title}</h3>
                      <p>{goalCurrentLabel} / {goalTargetLabel}</p>
                      <span className={styles.goalRemaining}>
                        {isGoalCompleted
                          ? "Objectif atteint pour cette période."
                          : `Encore ${goalRemainingLabel} à aller chercher.`}
                      </span>
                      <div className={styles.goalDeadline}>
                        <CalendarDays aria-hidden="true" />
                        <span>{goalDeadlineLabel}</span>
                      </div>
                    </div>
                    <TopographicIllustration className={styles.goalMountain} />
                  </div>
                </div>
              </FadeIn>
              </div>

              <div className={styles.quickPanelWrap}>
                <FadeIn delay={0.4}>
                <div className={`${styles.surface} ${styles.quickPanel}`}>
                  <SurfaceHeader
                    title="Aperçu rapide"
                    description="Les repères essentiels de la période."
                  />
                  <div className={styles.quickStats}>
                    <div><Gauge aria-hidden="true" /><span>Allure moyenne</span><strong>{formatPace(dashboardData.rollingDuration, dashboardData.rollingDistance)}</strong></div>
                    <div><Mountain aria-hidden="true" /><span>Dénivelé moyen</span><strong>{formatNumber(averageElevation)} m / sortie</strong></div>
                    <div><Timer aria-hidden="true" /><span>Sortie la plus longue</span><strong>{dashboardData.bestActivity ? formatDistance(dashboardData.bestActivity.distance || 0, 1) : "0 km"}</strong></div>
                    <div><CalendarDays aria-hidden="true" /><span>Jours actifs</span><strong>{dashboardData.activeDays} / 30</strong></div>
                  </div>
                </div>
              </FadeIn>
              </div>

              <div className={styles.heatmapPanelWrap}>
                <FadeIn delay={0.46}>
                <div className={`${styles.surface} ${styles.heatmapPanel}`}>
                  <SurfaceHeader
                    title="Rythme d’exploration"
                    description={dashboardData.heatmapDescription}
                    action={
                      <span className={styles.monthBadge}>
                        {dashboardData.heatmapMonthLabel} · 4 semaines
                      </span>
                    }
                  />
                  <ExplorationHeatmap activities={dashboardData.completedActivities} />
                </div>
              </FadeIn>
              </div>

              <div className={styles.badgesPanelWrap}>
                <FadeIn delay={0.52}>
                <div className={`${styles.surface} ${styles.badgesPanel}`}>
                  <SurfaceHeader
                    title="Badges du refuge"
                    description="Des jalons visibles, sans transformer l’app en carnaval."
                    action={
                      <div className={styles.badgeHeaderActions}>
                        <span className={styles.badgeCount}>
                          <ShieldCheck aria-hidden="true" /> {unlockedBadgesCount} / {summitBadges.length} débloqués
                        </span>
                        <Link href="/badges" className={styles.badgeCatalogLink}>
                          Voir tous <ArrowUpRight aria-hidden="true" />
                        </Link>
                      </div>
                    }
                  />
                  <div className={styles.badgeGrid}>
                    {badgePreview.map((badge) => {
                      const BadgeIcon = badge.icon;

                      return (
                        <div
                          key={badge.title}
                          className={`${styles.badgeCard} ${BADGE_TONE_CLASSES[badge.tone]} ${
                            badge.unlocked ? styles.badgeUnlocked : ""
                          }`}
                        >
                          <span className={styles.badgeMedallion}>
                            <BadgeIcon aria-hidden="true" />
                          </span>
                          <strong>{badge.title}</strong>
                          <p>{badge.unlocked ? badge.unlockedText : badge.hint}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>
              </div>

              <div className={styles.messagePanelWrap}>
                <FadeIn delay={0.58}>
                <div className={`${styles.surface} ${styles.messagePanel}`}>
                  <Quote className={styles.quoteIcon} aria-hidden="true" />
                  <div className={styles.messageContent}>
                    <div className={styles.messageTopline}>
                      <span className={styles.messageEyebrow}>
                        <Compass aria-hidden="true" /> Humeur du refuge
                      </span>
                    </div>

                    <div className={styles.messageBody}>
                      <h2>Message du refuge</h2>
                      <strong>{refugeMessage.title}</strong>
                      <p>{refugeMessage.body}</p>
                    </div>

                    <div className={styles.messageMeta}>
                      <Activity aria-hidden="true" />
                      {daysSinceLastActivity === null
                        ? "Aucune sortie récente"
                        : daysSinceLastActivity === 0
                          ? "Dernière sortie aujourd’hui"
                          : `Dernière sortie il y a ${formatDayCount(daysSinceLastActivity)}`}
                    </div>
                  </div>
                  <ForestLineIllustration className={styles.forestIllustration} />
                </div>
              </FadeIn>
              </div>

              <div className={styles.recommendationsWrap}>
                <FadeIn delay={0.64}>
                <div className={`${styles.surface} ${styles.recommendations}`}>
                  <h2>À surveiller & recommandations</h2>
                  <div className={styles.recommendationGrid}>
                    {recommendations.map((recommendation) => {
                      const Icon = recommendation.icon;

                      return (
                        <Link
                          href={recommendation.href}
                          key={recommendation.title}
                          className={styles.recommendationItem}
                        >
                          <div className={styles.recommendationIcon}>
                            <Icon aria-hidden="true" />
                          </div>
                          <div className={styles.recommendationContent}>
                            <strong>{recommendation.title}</strong>
                            <p>{recommendation.description}</p>
                            <span
                              className={
                                recommendation.tone === "warning"
                                  ? styles.recommendationWarning
                                  : styles.recommendationSuccess
                              }
                            >
                              {recommendation.label}
                            </span>
                          </div>
                          <ChevronRight aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>
              </div>
            </div>
          </>
      </div>
    </DashboardLayout>
  );
}
