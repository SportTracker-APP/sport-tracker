"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Share2,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  useActivity,
  useCompletePlannedWorkout,
  usePlannedWorkoutSuggestion,
} from "@/hooks/use-activities";

import { ActivityExpeditionCover } from "./activity-expedition-cover";
import {
  ActivityAnalysis,
  ActivityDetailError,
  ActivityDetailLoading,
  ActivityFooterActions,
  ActivityJournal,
  ActivityQuickStats,
} from "./activity-detail-sections";
import {
  formatActivityDate,
  getActivityPhotos,
  getElevationData,
  getSportLabel,
} from "./activity-detail-utils";
import {
  buildActivityFieldRows,
  buildActivityMetrics,
  type CoverMode,
} from "./activity-detail-view-model";
import styles from "./activity-detail.module.css";

export function ActivityDetailView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const activityId = params.id;
  const { data: activity, isLoading, isError, refetch } = useActivity(activityId);
  const { data: plannedSuggestion } =
    usePlannedWorkoutSuggestion(activityId);
  const completePlannedWorkout = useCompletePlannedWorkout();
  const [coverMode, setCoverMode] = useState<CoverMode>("map");
  const [activePhoto, setActivePhoto] = useState(0);
  const [shareStatus, setShareStatus] = useState<"idle" | "done">("idle");
  const [menuOpen, setMenuOpen] = useState(false);

  const photos = useMemo(
    () => (activity ? getActivityPhotos(activity) : []),
    [activity],
  );
  const elevation = useMemo(
    () => (activity ? getElevationData(activity) : null),
    [activity],
  );
  const metrics = useMemo(
    () => (activity ? buildActivityMetrics(activity) : []),
    [activity],
  );
  const fieldRows = useMemo(
    () => (activity ? buildActivityFieldRows(activity) : []),
    [activity],
  );

  if (isLoading) return <ActivityDetailLoading />;

  if (isError || !activity) {
    return <ActivityDetailError onRetry={() => void refetch()} />;
  }

  const date = formatActivityDate(activity.startedAt);
  const title = activity.title?.trim() || `${getSportLabel(activity)} outdoor`;

  async function shareActivity() {
    const shareData = {
      title,
      text: `Découvre cette sortie HOVREN : ${title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
      setShareStatus("done");
      window.setTimeout(() => setShareStatus("idle"), 1800);
    } catch {
      setShareStatus("idle");
    }
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/activites");
  }

  return (
    <DashboardLayout variant="refuge">
      <article className={styles.page}>
        <header className={styles.topActions}>
          <button type="button" className={styles.backButton} onClick={goBack}>
            <ArrowLeft aria-hidden="true" />
            Retour au carnet
          </button>
          <div className={styles.topActionsRight}>
            <button
              type="button"
              className={styles.shareButton}
              onClick={() => void shareActivity()}
            >
              {shareStatus === "done" ? (
                <Check aria-hidden="true" />
              ) : (
                <Share2 aria-hidden="true" />
              )}
              {shareStatus === "done" ? "Lien copié" : "Partager"}
            </button>
            <div className={styles.menuWrap}>
              <button
                type="button"
                className={styles.menuButton}
                aria-expanded={menuOpen}
                aria-label="Ouvrir les actions de la sortie"
                onClick={() => setMenuOpen((current) => !current)}
              >
                <ChevronDown aria-hidden="true" />
              </button>
              {menuOpen ? (
                <div className={styles.menuPanel}>
                  <Link href="/statistiques">Voir mes statistiques</Link>
                  <Link href="/activites">Toutes mes sorties</Link>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {plannedSuggestion ? (
          <section className={styles.plannedLink} aria-label="Séance planifiée">
            <div>
              <span>Correspondance trouvée</span>
              <strong>
                Cette trace ressemble à «{" "}
                {plannedSuggestion.title || "ta séance planifiée"} ».
              </strong>
            </div>
            <button
              type="button"
              disabled={completePlannedWorkout.isPending}
              onClick={() =>
                completePlannedWorkout.mutate({
                  plannedWorkoutId: plannedSuggestion.id,
                  activityId: activity.id,
                })
              }
            >
              {completePlannedWorkout.isPending
                ? "Association…"
                : "Associer la séance"}
            </button>
          </section>
        ) : null}

        <ActivityExpeditionCover
          activity={activity}
          activePhoto={activePhoto}
          coverMode={coverMode}
          date={date}
          photos={photos}
          title={title}
          onCoverModeChange={setCoverMode}
          onPhotoChange={setActivePhoto}
        />
        <ActivityQuickStats metrics={metrics} />
        <ActivityAnalysis
          activity={activity}
          elevation={elevation}
          fieldRows={fieldRows}
        />
        <ActivityJournal activity={activity} />
        <ActivityFooterActions />
      </article>
    </DashboardLayout>
  );
}
