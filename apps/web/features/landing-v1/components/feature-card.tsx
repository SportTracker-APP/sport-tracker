import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <article className="group relative flex min-h-[15.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white/82 p-5 shadow-[0_18px_52px_rgba(15,64,49,0.12)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(185,246,208,0.36),transparent_34%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-900/10 bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="relative mt-6 text-lg font-semibold text-slate-950">
        {title}
      </h3>
      <p className="relative mt-3 text-sm leading-7 text-slate-600">
        {description}
      </p>
    </article>
  );
}
