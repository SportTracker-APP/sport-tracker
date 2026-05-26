import {
  Activity,
  Flame,
  LucideIcon,
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
  const isTrophy = Icon === Trophy;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-white/5 bg-zinc-950/70 p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl sm:p-6",
        isActivity &&
          "border-violet-500/20 bg-violet-500/10",
        isRoute &&
          "border-sky-500/20 bg-sky-500/10",
        isFlame &&
          "border-orange-500/20 bg-orange-500/10",
        isTrophy &&
          "border-emerald-500/20 bg-emerald-500/10"
      )}
    >
      {/* Glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          isActivity &&
            "bg-gradient-to-br from-violet-400/10 to-transparent",
          isRoute &&
            "bg-gradient-to-br from-sky-400/10 to-transparent",
          isFlame &&
            "bg-gradient-to-br from-orange-400/10 to-transparent",
          isTrophy &&
            "bg-gradient-to-br from-emerald-400/10 to-transparent"
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 sm:text-sm">
            {title}
          </p>

          <h3 className="mt-3 truncate text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {value}
          </h3>

          <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-black/40 transition-all duration-300 group-hover:scale-105 sm:h-14 sm:w-14",
            isActivity &&
              "border-violet-500/20 text-violet-400",
            isRoute &&
              "border-sky-500/20 text-sky-400",
            isFlame &&
              "border-orange-500/20 text-orange-400",
            isTrophy &&
              "border-emerald-500/20 text-emerald-400"
          )}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}