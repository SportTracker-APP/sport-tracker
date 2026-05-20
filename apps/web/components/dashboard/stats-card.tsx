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
  <div className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900">
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

    <div className="relative flex items-start justify-between">
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          {title}
        </p>

        <h3 className="text-4xl font-bold tracking-tight text-white">
          {value}
        </h3>

        <p className="max-w-[180px] text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-black/40 p-3 text-zinc-300">
        <Icon size={22} />
      </div>
    </div>
  </div>
);
}