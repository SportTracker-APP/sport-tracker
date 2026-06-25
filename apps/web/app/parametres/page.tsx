import { Leaf, ShieldCheck, UserRound } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PasswordSettingsCard } from "@/components/settings/password-settings-card";
import { ProfileSettingsCard } from "@/components/settings/profile-settings-card";
import { FadeIn } from "@/components/ui/fade-in";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="app-settings-page">
        <FadeIn delay={0.08}>
          <section className="app-settings-hero">
            <div className="app-settings-hero-decoration" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="app-settings-hero-content">
              <div className="app-settings-kicker">
                <Leaf aria-hidden="true" />
                Espace personnel
              </div>

              <div className="app-settings-heading">
                <div>
                  <h1>Paramètres</h1>
                  <p>
                    Gére ton profil, ton identité Montaro et la sécurité de
                    ton compte.
                  </p>
                </div>

                <div className="app-settings-status" aria-label="Compte sécurisé">
                  <ShieldCheck aria-hidden="true" />
                  <span>
                    <strong>Compte protégé</strong>
                    <small>Tes données restent privées</small>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <div className="app-settings-grid">
          <FadeIn delay={0.16}>
            <section className="app-settings-panel app-settings-profile-panel">
              <div className="app-settings-panel-accent" aria-hidden="true">
                <UserRound />
              </div>

              <ProfileSettingsCard />
            </section>
          </FadeIn>

          <FadeIn delay={0.24}>
            <section className="app-settings-panel app-settings-security-panel">
              <div className="app-settings-panel-accent" aria-hidden="true">
                <ShieldCheck />
              </div>

              <PasswordSettingsCard />
            </section>
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}
