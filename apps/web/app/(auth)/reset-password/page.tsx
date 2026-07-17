import { Suspense } from "react";

import { BookOpen, Map, Mountain, TrendingUp, Trophy } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthThemeToggle } from "@/components/theme/auth-theme-toggle";
import { XSocialLink } from "@/features/landing/components/x-social-link";

export default function ResetPasswordPage() {
  return (
    <main className="app-auth-page relative min-h-screen overflow-hidden bg-black text-white">
      <div className="app-auth-ambient-top absolute inset-0 bg-[radial-gradient(circle_at_top_right,#7c3aed33,transparent_35%)]" />
      <div className="app-auth-ambient-bottom absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#6d28d922,transparent_30%)]" />
      <div className="app-auth-glow-left absolute top-1/2 left-[-150px] h-[650px] w-[650px] -translate-y-1/2 rounded-full bg-violet-700/20 blur-3xl" />
      <div className="app-auth-glow-right absolute top-[10%] right-[-120px] h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="app-auth-divider absolute top-0 left-1/2 hidden h-full w-px bg-white/5 lg:block" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-soft-light">
        <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        <div className="absolute top-6 right-6 z-20 hidden lg:block lg:top-10 lg:right-10">
          <AuthThemeToggle />
        </div>

        <div className="app-auth-left relative hidden flex-col justify-center overflow-hidden border-r border-white/5 px-16 py-12 lg:flex">
          <div className="app-auth-brand-row absolute top-12 left-16 flex items-center gap-4">
            <div className="app-auth-logo app-brand-logo flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10 backdrop-blur-xl">
              <Mountain className="h-6 w-6 text-violet-400" />
            </div>
            <span className="text-3xl font-bold tracking-normal">
              HOVREN
            </span>
            <div className="app-auth-brand-kicker ml-2 inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 backdrop-blur-xl">
              Carnet • Sommets • Souvenirs
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-xl">
            <div className="space-y-10">
              <div className="space-y-7">
                <h1 className="max-w-[700px] text-7xl leading-[0.95] font-bold tracking-[-0.05em]">
                  Sécurise ton{" "}
                  <span className="bg-gradient-to-r from-pink-300 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">
                    aventure.
                  </span>
                </h1>

                <p className="max-w-sm text-lg leading-relaxed text-zinc-400">
                  Mets à jour ton accès et retrouve ton carnet outdoor.
                </p>
              </div>

              <div className="space-y-6 pt-4">
                <FeatureItem
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Carnet d'aventure"
                  description="Retrouve chaque sortie, sommet et souvenir enregistrés."
                />

                <FeatureItem
                  icon={<Map className="h-5 w-5" />}
                  title="Exploration"
                  description="Découvre les territoires parcourus et ceux qu'il reste à explorer."
                />

                <FeatureItem
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Progression outdoor"
                  description="Distance, D+, volume et progression.."
                />

                <FeatureItem
                  icon={<Trophy className="h-5 w-5" />}
                  title="Sommets & badges"
                  description="Débloque des sommets, défis et récompenses outdoor."
                />
              </div>
            </div>
          </div>

          <div className="absolute right-16 bottom-10 left-16 flex items-center justify-between text-sm text-zinc-600">
            <span>© 2026 HOVREN</span>
            <div className="flex items-center gap-8">
              <button className="transition hover:text-zinc-400">
                Confidentialité
              </button>
              <button className="transition hover:text-zinc-400">
                Conditions
              </button>
              <XSocialLink className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-zinc-600 transition hover:border-white/18 hover:bg-white/[0.075] hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300" />
            </div>
          </div>
        </div>

        <div className="app-auth-right app-auth-photo-panel relative flex items-center justify-center overflow-hidden p-6 lg:p-12">
          <div className="absolute h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute top-0 right-0 h-[300px] w-[300px] bg-fuchsia-500/10 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            <div className="mb-10 flex items-center justify-between gap-4 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="app-brand-logo flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10">
                  <Mountain className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-2xl font-bold tracking-normal">
                  HOVREN
                </span>
              </div>
              <AuthThemeToggle />
            </div>

            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
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

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="group flex items-start gap-4 transition-all duration-300">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 group-hover:border-violet-500/30 group-hover:bg-violet-500/10">
        <div className="text-violet-400">{icon}</div>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}
