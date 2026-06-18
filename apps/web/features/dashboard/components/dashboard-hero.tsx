import Link from "next/link";
import {
  CalendarDays,
  Compass,
  Link2,
  MapPinned,
  Mountain,
  Plus,
  Trophy,
  Zap,
} from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { GoalProgressSummary, GoalSummary } from "../types";
import { getSportLabel } from "../utils/activity-calculations";
import type { DashboardData } from "../utils/dashboard-data";
import {
  formatDistance,
  formatNumber,
  formatShortDate,
} from "../utils/date-format";

export function DashboardHero({
  dashboardData,
  nextAdventure,
  primaryGoal,
  goalProgress,
  goalCurrentLabel,
  goalTargetLabel,
  goalRemainingLabel,
}: {
  dashboardData: DashboardData;
  nextAdventure: string;
  primaryGoal: GoalSummary;
  goalProgress: GoalProgressSummary;
  goalCurrentLabel: string;
  goalTargetLabel: string;
  goalRemainingLabel: string;
}) {
  return (
    <FadeIn delay={0.1}>
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <div className={styles.heroKicker}>
              <Zap aria-hidden="true" />
              Carnet d’exploration
            </div>
            <h1>
              Bienvenue dans votre refuge <span>outdoor.</span>
            </h1>
            <p>
              {formatNumber(dashboardData.exploredSectors)} secteurs run, trail
              ou montagne découverts.{" "}
              {formatDistance(dashboardData.rollingDistance, 1)} parcourus et{" "}
              {formatNumber(dashboardData.rollingElevation)} m D+ gravis sur
              vos 30 derniers jours.
            </p>
            <p>
              Prochaine aventure : {nextAdventure}. Un terrain de jeu pour
              courir, grimper, rouler, marcher, et garder le fil.
            </p>

            <div className={styles.heroActions}>
              <Link
                href="/activites/nouvelle"
                className={styles.heroPrimaryButton}
              >
                <Plus aria-hidden="true" /> Tracer une sortie
              </Link>
              <Link
                href="/integrations/strava"
                className={styles.heroStravaButton}
              >
                <Link2 aria-hidden="true" /> Synchroniser Strava
              </Link>
              <Link href="/calendrier" className={styles.heroGhostButton}>
                <CalendarDays aria-hidden="true" /> Planifier
              </Link>
            </div>

            <div className={styles.heroMiniStats}>
              <div>
                <span>
                  <Mountain aria-hidden="true" /> D+ 30j
                </span>
                <strong>{formatNumber(dashboardData.rollingElevation)} m</strong>
              </div>
              <div>
                <span>
                  <Trophy aria-hidden="true" /> Progression
                </span>
                <strong>{goalProgress.progress}%</strong>
              </div>
              <div>
                <span>
                  <Compass aria-hidden="true" />{" "}
                  {primaryGoal.type === "DISTANCE_KM"
                    ? "Reste à parcourir"
                    : "Reste à accomplir"}
                </span>
                <strong>
                  {goalProgress.remaining > 0 ? goalRemainingLabel : "Validé"}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.heroGoalCard}>
            <div className={styles.heroGoalTopline}>
              <div className={styles.heroGoalIcon}>
                <Trophy aria-hidden="true" />
              </div>
              <div className={styles.heroGoalBadge}>
                <Mountain aria-hidden="true" />
              </div>
            </div>
            <p className={styles.heroGoalKicker}>Cap en cours</p>
            <h2>{primaryGoal.title}</h2>
            <p className={styles.heroGoalText}>
              {goalCurrentLabel} déjà validés sur {goalTargetLabel}. Encore{" "}
              {goalRemainingLabel}à aller chercher sans dramatiser. Enfin… un
              peu.
            </p>
            <div className={styles.heroProgressHeader}>
              <span>Progression</span>
              <strong>{goalProgress.progress}%</strong>
            </div>
            <div className={styles.heroProgressTrack}>
              <div
                style={{
                  width: `${Math.min(100, goalProgress.progress)}%`,
                }}
              />
            </div>
            <div className={styles.heroLastTrace}>
              <p>
                <MapPinned aria-hidden="true" /> Dernière trace
              </p>
              <strong>
                {dashboardData.latestActivity?.title ?? "Aucune sortie récente"}
              </strong>
              <span>
                {getSportLabel(dashboardData.latestActivity)}
                {dashboardData.latestActivity ? (
                  <>
                    <i>•</i>
                    {formatDistance(
                      dashboardData.latestActivity.distance || 0,
                      1,
                    )}
                    <i>•</i>
                    {formatShortDate(dashboardData.latestActivity.startedAt)}
                  </>
                ) : null}
              </span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
