import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { FadeIn } from "@/components/ui/fade-in";

import { ProfileSettingsCard } from "@/components/settings/profile-settings-card";

import { PasswordSettingsCard } from "@/components/settings/password-settings-card";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* HEADER */}
        <FadeIn delay={0.1}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Paramètres
            </h1>

            <p className="mt-2 text-zinc-400">
              Gérez votre profil et la sécurité de votre compte.
            </p>
          </div>
        </FadeIn>

        {/* CONTENT */}
        <div className="grid gap-6 xl:grid-cols-2">

          <FadeIn delay={0.2}>
            <ProfileSettingsCard />
          </FadeIn>

          <FadeIn delay={0.3}>
            <PasswordSettingsCard />
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}