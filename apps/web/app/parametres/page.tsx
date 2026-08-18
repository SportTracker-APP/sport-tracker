import { Leaf, ShieldCheck, UserRound } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PasswordSettingsCard } from "@/components/settings/password-settings-card";
import { ProfileSettingsCard } from "@/components/settings/profile-settings-card";
import { AdventureTerritoriesCard } from "@/components/settings/adventure-territories-card";
import styles from "@/components/settings/settings.module.css";
import { FadeIn } from "@/components/ui/fade-in";

export default function SettingsPage() {
  return (
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        <FadeIn delay={0.08}>
          <header className={styles.hero}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <Leaf aria-hidden="true" />
                Espace personnel
              </div>

              <h1>Paramètres</h1>
              <p>
                Gère ton profil, ton identité HOVREN et la sécurité de ton
                compte.
              </p>
            </div>

            <div className={styles.accountStatus} aria-label="Compte sécurisé">
              <ShieldCheck aria-hidden="true" />
              <span>
                <strong>Compte protégé</strong>
                <small>Tes données restent privées</small>
              </span>
            </div>
          </header>
        </FadeIn>

        <div className={styles.grid}>
          <FadeIn delay={0.16}>
            <section className={styles.panel}>
              <div className={styles.panelAccent} aria-hidden="true">
                <UserRound />
              </div>

              <ProfileSettingsCard />
            </section>
          </FadeIn>

          <FadeIn delay={0.24}>
            <section className={`${styles.panel} ${styles.securityPanel}`}>
              <div className={styles.panelAccent} aria-hidden="true">
                <ShieldCheck />
              </div>

              <PasswordSettingsCard />
            </section>
          </FadeIn>
        </div>

        <FadeIn delay={0.28}>
          <section className={`${styles.panel} ${styles.territoryPanel}`}>
            <AdventureTerritoriesCard />
          </section>
        </FadeIn>
      </main>
    </DashboardLayout>
  );
}
