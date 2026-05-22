import {
  Activity,
  ArrowRight,
  Shield,
  Target,
} from "lucide-react";

import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* GLOBAL BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#7c3aed33,transparent_35%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#6d28d922,transparent_30%)]" />

      {/* BIG LEFT GLOW */}
      <div className="absolute left-[-150px] top-1/2 h-[650px] w-[650px] -translate-y-1/2 rounded-full bg-violet-700/20 blur-3xl" />

      {/* RIGHT GLOW */}
      <div className="absolute right-[-120px] top-[10%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-3xl" />

      {/* CENTER LINE */}
      <div className="absolute left-1/2 top-0 hidden h-full w-px bg-white/5 lg:block" />

      {/* NOISE */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-soft-light">
        <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* LEFT PANEL */}
<div className="relative hidden flex-col justify-center overflow-hidden border-r border-white/5 px-16 py-12 lg:flex">
  {/* LOGO */}
  <div className="absolute left-16 top-12 flex items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10 backdrop-blur-xl">
      <Activity className="h-6 w-6 text-violet-400" />
    </div>

    <span className="text-3xl font-semibold tracking-tight">
      Sport Tracker
    </span>
  </div>

  {/* HERO */}
  <div className="relative z-10 mx-auto max-w-xl">
    <div className="space-y-10">
      {/* EYEBROW */}
      <div className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 backdrop-blur-xl">
        Performance • Discipline • Progression
      </div>

      {/* TITLE */}
      <div className="space-y-7">
        <h1 className="max-w-[700px] text-7xl font-bold leading-[0.95] tracking-[-0.05em]">
          Progresse{" "}
          <span className="bg-gradient-to-r from-pink-300 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">
            chaque jour.
          </span>
        </h1>

        <p className="max-w-sm text-lg leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-200">
            Sport Tracker
          </span>{" "}
          transforme tes données en progression
          concrète.
        </p>
      </div>

      {/* FEATURES */}
      <div className="space-y-6 pt-4">
        <FeatureItem
          icon={<Target className="h-5 w-5" />}
          title="Atteins tes objectifs"
          description="Crée une discipline durable et mesure chaque progrès."
        />

        <FeatureItem
          icon={<Shield className="h-5 w-5" />}
          title="Données sécurisées"
          description="Infrastructure moderne et sécurisée."
        />

        <FeatureItem
          icon={<ArrowRight className="h-5 w-5" />}
          title="Dashboard intelligent"
          description="Visualise instantanément tes performances."
        />
      </div>
    </div>
  </div>

  {/* FOOTER */}
  <div className="absolute bottom-10 left-16 right-16 flex items-center justify-between text-sm text-zinc-600">
    <span>© 2026 Sport Tracker</span>

    <div className="flex items-center gap-8">
      <button className="transition hover:text-zinc-400">
        Confidentialité
      </button>

      <button className="transition hover:text-zinc-400">
        Conditions
      </button>
    </div>
  </div>
</div>

        {/* RIGHT PANEL */}
        <div className="relative flex items-center justify-center overflow-hidden p-6 lg:p-12">
          {/* RIGHT ORB */}
          <div className="absolute h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-3xl" />

          {/* EXTRA LIGHT */}
          <div className="absolute right-0 top-0 h-[300px] w-[300px] bg-fuchsia-500/10 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            {/* MOBILE LOGO */}
            <div className="mb-12 flex items-center justify-center gap-4 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10">
                <Activity className="h-5 w-5 text-violet-400" />
              </div>

              <span className="text-2xl font-semibold">
                Sport Tracker
              </span>
            </div>

            <RegisterForm />
          </div>
        </div>
      </div>
    </main>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({
  icon,
  title,
  description,
}: FeatureItemProps) {
  return (
    <div className="group flex items-start gap-4 transition-all duration-300">
      {/* ICON */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 group-hover:border-violet-500/30 group-hover:bg-violet-500/10">
        <div className="text-violet-400">
          {icon}
        </div>
      </div>

      {/* TEXT */}
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-white">
          {title}
        </h3>

        <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}