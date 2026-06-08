import {
  Activity,
  Flame,
  LucideIcon,
  Mountain,
  Route,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: StatsCardProps) {
  const isActivity = Icon === Activity;

  const isRoute = Icon === Route;

  const isFlame = Icon === Flame;

  const isMountain = Icon === Mountain;

  const isTrophy = Icon === Trophy;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#181922]/92 p-5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.14] sm:p-6",

        isActivity &&
          "shadow-[0_10px_45px_rgba(139,92,246,0.10)]",

        isRoute &&
          "shadow-[0_10px_45px_rgba(56,189,248,0.08)]",

        (isFlame || isMountain) &&
          "shadow-[0_10px_45px_rgba(251,146,60,0.08)]",

        isTrophy &&
          "shadow-[0_10px_45px_rgba(16,185,129,0.08)]"
      )}
    >
      {/* MAIN ATMOSPHERE */}
      <div
        className={cn(
          "absolute inset-0 opacity-90 transition-opacity duration-500",

          isActivity &&
            "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_40%)]",

          isRoute &&
            "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_40%)]",

          isFlame &&
            "bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.14),transparent_40%)]",

          isMountain &&
            "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_40%)]",

          isTrophy &&
            "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_40%)]"
        )}
      />

      {/* SUBTLE COLOR DEPTH */}
      <div
        className={cn(
          "absolute inset-0 opacity-60",

          isActivity &&
            "bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.08),transparent_35%)]",

          isRoute &&
            "bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_35%)]",

          isFlame &&
            "bg-[radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.06),transparent_35%)]",

          isMountain &&
            "bg-[radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.08),transparent_35%)]",

          isTrophy &&
            "bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_35%)]"
        )}
      />

      {/* TOP LIGHT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_30%)]" />

      {/* INNER BORDER */}
      <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

      {/* NOISE */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-soft-light [background-image:url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* HOVER SHINE */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.03),transparent)]" />

      {/* CONTENT */}
      <div className="relative flex items-start justify-between gap-5">

        {/* LEFT */}
        <div className="min-w-0 flex-1">

          {/* TITLE */}
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
            {title}
          </p>

          {/* VALUE */}
          <h3 className="mt-4 truncate text-3xl font-bold tracking-tight text-white sm:text-[38px]">
            {value}
          </h3>

          {/* DESCRIPTION */}
          <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>

        {/* ICON */}
        <div
          className={cn(
            "app-stats-icon relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.05] backdrop-blur-xl transition-all duration-500 group-hover:scale-105",

            isActivity &&
              "app-stats-icon-activity text-violet-300",

            isRoute &&
              "text-sky-300",

            isFlame &&
              "text-orange-300",

            isMountain &&
              "text-emerald-300",

            isTrophy &&
              "text-emerald-300"
          )}
        >
          {/* ICON GLOW */}
          <div
            className={cn(
              "absolute inset-0 opacity-80",

              isActivity &&
                "bg-gradient-to-br from-violet-500/25 via-violet-500/8 to-transparent",

              isRoute &&
                "bg-gradient-to-br from-sky-500/25 via-sky-500/8 to-transparent",

              isFlame &&
                "bg-gradient-to-br from-orange-500/25 via-orange-500/8 to-transparent",

              isMountain &&
                "bg-gradient-to-br from-emerald-500/25 via-lime-500/10 to-transparent",

              isTrophy &&
                "bg-gradient-to-br from-emerald-500/25 via-emerald-500/8 to-transparent"
            )}
          />

          {/* ICON LIGHT */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_40%)]" />

          <Icon
            size={22}
            className="relative"
          />
        </div>
      </div>
    </div>
  );
}
