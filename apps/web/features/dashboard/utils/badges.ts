import {
  CloudRain,
  Flame,
  Mountain,
  Snowflake,
  Sunrise,
  Zap,
} from "lucide-react";

import type { Activity as SportActivity } from "@/lib/activities";

import type { BadgeDefinition } from "../types";

export function getUnlockedBadges(
  activities: SportActivity[],
  rollingActivities: SportActivity[],
): BadgeDefinition[] {
  const hasSummit = activities.some(
    (activity) =>
      ["TRAIL", "HIKING"].includes(activity.sport) &&
      (activity.elevationGain || 0) >= 300,
  );
  const rollingDistance = rollingActivities.reduce(
    (total, activity) => total + (activity.distance || 0),
    0,
  );
  const hasSunrise = activities.some((activity) => {
    const hour = new Date(activity.startedAt).getHours();
    return hour >= 4 && hour <= 8;
  });
  const hasWinter = activities.some((activity) => {
    const month = new Date(activity.startedAt).getMonth();
    return month === 11 || month <= 1;
  });
  const hasRain = activities.some((activity) =>
    `${activity.title ?? ""} ${activity.description ?? ""}`
      .toLowerCase()
      .includes("pluie"),
  );

  return [
    {
      title: "Premier sommet",
      icon: Mountain,
      unlocked: hasSummit,
      hint: "Une sortie trail ou randonnée avec du D+.",
      unlockedText: "La première bosse est cochée.",
      tone: "summit",
    },
    {
      title: "100 km",
      icon: Flame,
      unlocked: rollingDistance >= 100,
      hint: "100 km sur 30 jours.",
      unlockedText: "Le compteur commence à chauffer.",
      tone: "fire",
    },
    {
      title: "10 sorties en 30j",
      icon: Zap,
      unlocked: rollingActivities.length >= 10,
      hint: "La régularité qui paie.",
      unlockedText: "La discipline fait son petit effet.",
      tone: "energy",
    },
    {
      title: "Lever de soleil",
      icon: Sunrise,
      unlocked: hasSunrise,
      hint: "Sortie lancée entre 4 h et 8 h.",
      unlockedText: "Parti avant que la ville se réveille.",
      tone: "sunrise",
    },
    {
      title: "Sortie hivernale",
      icon: Snowflake,
      unlocked: hasWinter,
      hint: "Décembre, janvier ou février.",
      unlockedText: "Le froid n’a pas gagné.",
      tone: "winter",
    },
    {
      title: "Sous la pluie",
      icon: CloudRain,
      unlocked: hasRain,
      hint: "La sortie où le mental signe aussi.",
      unlockedText: "Sortie validée, météo vexée.",
      tone: "rain",
    },
  ];
}
