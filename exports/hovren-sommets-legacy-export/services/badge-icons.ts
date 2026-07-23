import {
  CloudRain,
  Crown,
  Flag,
  Flame,
  Footprints,
  Leaf,
  Mountain,
  Route,
  ShieldCheck,
  Snowflake,
  Sun,
  Sunrise,
  TreePine,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

const BADGE_ICONS: Record<string, LucideIcon> = {
  CloudRain,
  Crown,
  Flag,
  Flame,
  Footprints,
  Leaf,
  Mountain,
  Route,
  ShieldCheck,
  Snowflake,
  Sun,
  Sunrise,
  TreePine,
  TrendingUp,
  Trophy,
  Zap,
};

export function getBadgeIcon(icon: string): LucideIcon {
  return BADGE_ICONS[icon] ?? Mountain;
}
