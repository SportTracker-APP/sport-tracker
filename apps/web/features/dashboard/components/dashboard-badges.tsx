import { ShieldCheck } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { BadgeDefinition, BadgeTone } from "../types";
import { SurfaceHeader } from "./dashboard-surface-header";

const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  summit: styles.badgeToneSummit,
  fire: styles.badgeToneFire,
  energy: styles.badgeToneEnergy,
  sunrise: styles.badgeToneSunrise,
  winter: styles.badgeToneWinter,
  rain: styles.badgeToneRain,
};

export function DashboardBadges({
  badges,
  unlockedCount,
}: {
  badges: BadgeDefinition[];
  unlockedCount: number;
}) {
  return (
    <div className={styles.badgesPanelWrap}>
      <FadeIn delay={0.52}>
        <div className={`${styles.surface} ${styles.badgesPanel}`}>
          <SurfaceHeader
            title="Badges du refuge"
            description="Des jalons visibles, sans transformer l’app en carnaval."
            action={
              <span className={styles.badgeCount}>
                <ShieldCheck aria-hidden="true" /> {unlockedCount} / 6
                débloqués
              </span>
            }
          />
          <div className={styles.badgeGrid}>
            {badges.map((badge) => {
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={badge.title}
                  className={`${styles.badgeCard} ${BADGE_TONE_CLASSES[badge.tone]} ${
                    badge.unlocked ? styles.badgeUnlocked : ""
                  }`}
                >
                  <span className={styles.badgeMedallion}>
                    <BadgeIcon aria-hidden="true" />
                  </span>
                  <strong>{badge.title}</strong>
                  <p>{badge.unlocked ? badge.unlockedText : badge.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
