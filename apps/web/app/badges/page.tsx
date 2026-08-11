"use client";

import {
  Check,
  LibraryBig,
  LockKeyhole,
  Medal,
  Mountain,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
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

function formatProgressValue(value: number, unit: string): string {
  const maximumFractionDigits = unit === "km" ? 1 : 0;

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
  }).format(value);
}

function BadgesSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <span className={styles.srOnly} role="status">
        Chargement de la collection de badges…
      </span>

      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonHeaderCopy}>
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonTitle} />
          <span className={styles.skeletonText} />
        </div>
        <div className={styles.skeletonProgress}>
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonValue} />
          <span className={styles.skeletonTrack} />
        </div>
      </div>

      <div className={styles.skeletonFilters}>
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={styles.skeletonCard}>
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonMedallion} />
            <span className={styles.skeletonCardTitle} />
            <span className={styles.skeletonCardText} />
            <span className={styles.skeletonCardFooter} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const { data: badges = [], isLoading, error, refetch } = useSummitBadges();
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

  function resetFilters() {
    setCategory("ALL");
    setStatus("ALL");
  }

  return (
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        {isLoading ? (
          <BadgesSkeleton />
        ) : (
          <>
            <FadeIn delay={0.04}>
              <header className={styles.header}>
                <div className={styles.headerCopy}>
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
                  <div className={styles.progressHeading}>
                    <span>Collection débloquée</span>
                    <strong>
                      {error ? "— / —" : `${unlockedCount} / ${badges.length}`}
                    </strong>
                  </div>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-label="Collection de badges débloquée"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={error ? undefined : progress}
                    aria-valuetext={
                      error
                        ? "Progression indisponible"
                        : `${unlockedCount} badges sur ${badges.length}, soit ${progress} pour cent du catalogue`
                    }
                  >
                    <span style={{ width: `${error ? 0 : progress}%` }} />
                  </div>
                  <small>
                    {error
                      ? "Progression indisponible"
                      : `${progress}% du catalogue`}
                  </small>
                </div>

                <Mountain
                  className={styles.headerMountain}
                  aria-hidden="true"
                />
              </header>
            </FadeIn>

            {!error ? (
              <section
                className={styles.filters}
                aria-label="Filtres des badges"
              >
                <fieldset className={styles.categoryFilters}>
                  <legend>Catégorie</legend>
                  <div>
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
                </fieldset>

                <fieldset className={styles.statusFilters}>
                  <legend>Statut</legend>
                  <div>
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
                </fieldset>
              </section>
            ) : null}

            {error ? (
              <section
                className={styles.state}
                aria-labelledby="badges-error-title"
              >
                <span className={styles.stateIcon} aria-hidden="true">
                  <RotateCcw />
                </span>
                <div>
                  <h2 id="badges-error-title">La collection reste à l’abri.</h2>
                  <p>
                    Impossible de charger les badges pour le moment. Réessaie
                    dans quelques instants.
                  </p>
                </div>
                <button type="button" onClick={() => void refetch()}>
                  <RotateCcw aria-hidden="true" /> Réessayer
                </button>
              </section>
            ) : null}

            {!error && badges.length === 0 ? (
              <section
                className={styles.state}
                aria-labelledby="badges-empty-title"
              >
                <span className={styles.stateIcon} aria-hidden="true">
                  <LibraryBig />
                </span>
                <div>
                  <h2 id="badges-empty-title">
                    La collection est encore vide.
                  </h2>
                  <p>Les badges disponibles apparaîtront ici.</p>
                </div>
              </section>
            ) : null}

            {!error && visibleBadges.length > 0 ? (
              <section className={styles.grid} aria-live="polite">
                {visibleBadges.map((badge, index) => {
                  const Icon = getBadgeIcon(badge.icon);
                  const badgeProgress = badge.progress;
                  const badgeProgressPercent = badgeProgress
                    ? Math.min(
                        100,
                        Math.round(
                          (badgeProgress.current / badgeProgress.target) * 100,
                        ),
                      )
                    : 0;
                  const isStarted = Boolean(
                    !badge.unlocked &&
                    badgeProgress &&
                    badgeProgress.current > 0,
                  );
                  const visualStatus = badge.unlocked
                    ? "unlocked"
                    : isStarted
                      ? "started"
                      : "locked";

                  return (
                    <FadeIn key={badge.id} delay={Math.min(index * 0.025, 0.3)}>
                      <article
                        className={`${styles.badge} ${styles[`tone_${badge.tone}`]} ${
                          badge.unlocked ? styles.unlocked : styles.locked
                        }`}
                        data-status={visualStatus}
                      >
                        <div className={styles.badgeTopline}>
                          <span className={styles.categoryLabel}>
                            {badge.category}
                          </span>
                          <span
                            className={styles.statusLabel}
                            data-status={visualStatus}
                          >
                            {badge.unlocked ? (
                              <Check aria-hidden="true" />
                            ) : (
                              <LockKeyhole aria-hidden="true" />
                            )}
                            {badge.unlocked
                              ? "Débloqué"
                              : isStarted
                                ? "En progression"
                                : "À accomplir"}
                          </span>
                        </div>

                        <span className={styles.medallion} aria-hidden="true">
                          <Icon />
                        </span>
                        <h2>{badge.name}</h2>
                        <p>
                          {badge.unlocked ? badge.description : badge.criterion}
                        </p>

                        {!badge.unlocked && badgeProgress ? (
                          <div className={styles.badgeProgress}>
                            <div>
                              <span>Progression</span>
                              <strong>
                                {formatProgressValue(
                                  badgeProgress.current,
                                  badgeProgress.unit,
                                )}{" "}
                                /{" "}
                                {formatProgressValue(
                                  badgeProgress.target,
                                  badgeProgress.unit,
                                )}{" "}
                                {badgeProgress.unit}
                              </strong>
                            </div>
                            <div
                              className={styles.badgeProgressTrack}
                              role="progressbar"
                              aria-label={`Progression vers le badge ${badge.name}`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={badgeProgressPercent}
                              aria-valuetext={`${formatProgressValue(
                                badgeProgress.current,
                                badgeProgress.unit,
                              )} sur ${formatProgressValue(
                                badgeProgress.target,
                                badgeProgress.unit,
                              )} ${badgeProgress.unit}`}
                            >
                              <span
                                style={{ width: `${badgeProgressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : null}

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

            {!error && badges.length > 0 && visibleBadges.length === 0 ? (
              <section
                className={styles.state}
                aria-labelledby="badges-filter-empty-title"
              >
                <span className={styles.stateIcon} aria-hidden="true">
                  <LibraryBig />
                </span>
                <div>
                  <h2 id="badges-filter-empty-title">
                    Aucun badge dans cette sélection.
                  </h2>
                  <p>
                    Essaie une autre catégorie ou affiche toute la collection.
                  </p>
                </div>
                <button type="button" onClick={resetFilters}>
                  Afficher toute la collection
                </button>
              </section>
            ) : null}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
