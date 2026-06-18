import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { GoalProgressSummary } from "../types";
import { TopographicIllustration } from "./dashboard-illustrations";

export function GoalRing({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={styles.goalRingShell}>
      <div
        className={styles.goalRing}
        style={{
          background: `conic-gradient(var(--goal-ring-active) 0 ${safeProgress}%, var(--goal-ring-track) ${safeProgress}% 100%)`,
        }}
      >
        <div className={styles.goalRingInner}>{safeProgress}%</div>
      </div>
    </div>
  );
}

export function DashboardMonthlyGoal({
  progress,
  title,
  currentLabel,
  targetLabel,
  remainingLabel,
  deadlineLabel,
}: {
  progress: GoalProgressSummary;
  title: string;
  currentLabel: string;
  targetLabel: string;
  remainingLabel: string;
  deadlineLabel: string;
}) {
  return (
    <div className={styles.goalPanelWrap}>
      <FadeIn delay={0.34}>
        <div className={`${styles.surface} ${styles.goalPanel}`}>
          <div className={styles.goalPanelHeader}>
            <h2>Objectif en cours</h2>
            <Link href="/objectifs">Modifier</Link>
          </div>
          <div className={styles.goalPanelContent}>
            <GoalRing progress={progress.progress} />
            <div className={styles.goalPanelCopy}>
              <h3>{title}</h3>
              <p>
                {currentLabel} / {targetLabel}
              </p>
              <span className={styles.goalRemaining}>
                Encore {remainingLabel} à aller chercher.
              </span>
              <div className={styles.goalDeadline}>
                <CalendarDays aria-hidden="true" />
                <span>{deadlineLabel}</span>
              </div>
            </div>
            <TopographicIllustration className={styles.goalMountain} />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
