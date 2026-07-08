"use client";

import { Check, LockKeyhole, Medal, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useSummitBadges } from "@/hooks/use-summits";
import { getBadgeIcon } from "@/lib/badge-icons";
import type { SummitBadge } from "@/lib/summit-api";

import styles from "./badges.module.css";

type StatusFilter = "ALL" | "UNLOCKED" | "LOCKED";

const CATEGORIES: Array<SummitBadge["category"]> = [
  "Distance",
  "Sommets",
  "Conditions",
  "Exploits D+",
  "Progression D+",
  "Défis mensuels",
];

function formatUnlockDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function BadgesPage() {
  const { data: badges = [], isLoading, error } = useSummitBadges();
  const [category, setCategory] = useState<SummitBadge["category"] | "ALL">(
    "ALL",
  );
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const progress = badges.length
    ? Math.round((unlockedCount / badges.length) * 100)
    : 0;
  const visibleBadges = useMemo(
    () =>
      badges.filter((badge) => {
        if (category !== "ALL" && badge.category !== category) {
          return false;
        }

        if (status === "UNLOCKED" && !badge.unlocked) {
          return false;
        }

        if (status === "LOCKED" && badge.unlocked) {
          return false;
        }

        return true;
      }),
    [badges, category, status],
  );

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <FadeIn delay={0.04}>
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>
                <Medal aria-hidden="true" /> Collection du refuge
              </span>
              <h1>Badges</h1>
              <p>
                Les traces, les sommets et les saisons qui racontent ton
                parcours.
              </p>
            </div>

            <div className={styles.progressSummary}>
              <div>
                <span>Collection débloquée</span>
                <strong>
                  {unlockedCount} / {badges.length}
                </strong>
              </div>
              <div className={styles.progressTrack}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <small>{progress}% du catalogue</small>
            </div>
          </header>
        </FadeIn>

        <section className={styles.filters} aria-label="Filtres des badges">
          <div className={styles.categoryFilters}>
            <button
              type="button"
              aria-pressed={category === "ALL"}
              onClick={() => setCategory("ALL")}
            >
              Tous
            </button>
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.statusFilters}>
            <button
              type="button"
              aria-pressed={status === "ALL"}
              onClick={() => setStatus("ALL")}
            >
              Tous
            </button>
            <button
              type="button"
              aria-pressed={status === "UNLOCKED"}
              onClick={() => setStatus("UNLOCKED")}
            >
              Débloqués
            </button>
            <button
              type="button"
              aria-pressed={status === "LOCKED"}
              onClick={() => setStatus("LOCKED")}
            >
              À accomplir
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className={styles.state}>Chargement des badges…</div>
        ) : null}
        {error ? (
          <div className={styles.state}>Impossible de charger les badges.</div>
        ) : null}

        {!isLoading && !error ? (
          <section className={styles.grid} aria-live="polite">
            {visibleBadges.map((badge, index) => {
              const Icon = getBadgeIcon(badge.icon);

              return (
                <FadeIn key={badge.id} delay={Math.min(index * 0.025, 0.3)}>
                  <article
                    className={`${styles.badge} ${styles[`tone_${badge.tone}`]} ${
                      badge.unlocked ? styles.unlocked : styles.locked
                    }`}
                  >
                    <div className={styles.badgeTopline}>
                      <span>{badge.category}</span>
                      <span className={styles.statusIcon}>
                        {badge.unlocked ? (
                          <Check aria-label="Débloqué" />
                        ) : (
                          <LockKeyhole aria-label="À accomplir" />
                        )}
                      </span>
                    </div>

                    <span className={styles.medallion} aria-hidden="true">
                      <Icon />
                    </span>
                    <h2>{badge.name}</h2>
                    <p>
                      {badge.unlocked ? badge.description : badge.criterion}
                    </p>

                    <footer>
                      {badge.unlocked ? (
                        <span>
                          <ShieldCheck aria-hidden="true" /> Débloqué
                          {badge.unlockedAt
                            ? ` le ${formatUnlockDate(badge.unlockedAt)}`
                            : ""}
                        </span>
                      ) : (
                        <span>{badge.hint}</span>
                      )}
                    </footer>
                  </article>
                </FadeIn>
              );
            })}
          </section>
        ) : null}

        {!isLoading && !error && visibleBadges.length === 0 ? (
          <div className={styles.state}>Aucun badge dans cette sélection.</div>
        ) : null}
      </main>
    </DashboardLayout>
  );
}
