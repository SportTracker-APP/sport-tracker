import { LucideIcon } from "lucide-react";

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
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900 sm:p-6">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 sm:text-sm">
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-black/40 text-zinc-300 transition-colors duration-300 group-hover:border-zinc-700 group-hover:text-white sm:h-14 sm:w-14">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}