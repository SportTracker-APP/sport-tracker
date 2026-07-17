import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <article className="group relative flex min-h-[15.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.065] bg-white/[0.042] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/16 hover:bg-white/[0.058]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(139,92,246,0.16),transparent_34%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-violet-100">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="relative mt-6 text-lg font-semibold text-white">{title}</h3>
      <p className="relative mt-3 text-sm leading-7 text-slate-400">
        {description}
      </p>
    </article>
  );
}
