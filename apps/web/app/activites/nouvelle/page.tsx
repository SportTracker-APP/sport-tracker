"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Flame,
  Mountain,
  Plus,
  Timer,
} from "lucide-react";

import {
  ACTIVITY_SPORTS,
} from "@/components/activities/activity-form.constants";
import { CreateActivityForm } from "@/components/activities/create-activity-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";

import styles from "./new-activity-page.module.css";

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes
    .toString()
    .padStart(2, "0")}`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    notation: value >= 10_000 ? "compact" : "standard",
  }).format(value);
}

export default function NewActivityPage() {
  const searchParams = useSearchParams();
  const isPlanning =
    searchParams.get("status") !== "COMPLETED";
  const { data: activities = [], isLoading } =
    useActivities();

  const recentActivities = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);

    thirtyDaysAgo.setDate(today.getDate() - 30);

    return activities.filter((activity) => {
      const startedAt = new Date(activity.startedAt);

      return (
        activity.status !== "PLANNED" &&
        startedAt >= thirtyDaysAgo &&
        startedAt <= today
      );
    });
  }, [activities]);

  const recentDuration = useMemo(
    () =>
      recentActivities.reduce(
        (total, activity) =>
          total + activity.duration,
        0,
      ),
    [recentActivities],
  );

  const recentCalories = useMemo(
    () =>
      recentActivities.reduce(
        (total, activity) =>
          total + (activity.calories || 0),
        0,
      ),
    [recentActivities],
  );

  const quickStats = [
    {
      label: "Activités sur 30 jours",
      value: isLoading
        ? "…"
        : String(recentActivities.length),
      icon: Activity,
      tone: styles.statViolet,
    },
    {
      label: "Temps sportif",
      value: isLoading
        ? "…"
        : formatDuration(recentDuration),
      icon: Timer,
      tone: styles.statSky,
    },
    {
      label: "Calories",
      value: isLoading
        ? "…"
        : formatCompactNumber(recentCalories),
      icon: Flame,
      tone: styles.statAmber,
    },
  ];

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroPhoto} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroGrid} />

          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <div className={styles.heroKicker}>
                {isPlanning ? (
                  <CalendarDays aria-hidden="true" />
                ) : (
                  <Plus aria-hidden="true" />
                )}
                {isPlanning
                  ? "Planifier une sortie"
                  : "Ajouter une activité passée"}
              </div>

              <h1>
                {isPlanning ? (
                  <>
                    Planifiez votre prochaine{" "}
                    <span>sortie.</span>
                  </>
                ) : (
                  <>
                    Ajoutez une activité déjà{" "}
                    <span>réalisée.</span>
                  </>
                )}
              </h1>

              <p>
                {isPlanning
                  ? "Préparez votre séance, choisissez son créneau et retrouvez-la dans votre calendrier. Vous pourrez compléter ses résultats après la sortie."
                  : "Renseignez les données d’une séance terminée pour enrichir vos statistiques, votre progression et votre carnet outdoor."}
              </p>

              <div className={styles.sportPills}>
                {ACTIVITY_SPORTS.slice(0, 4).map(
                  (sport) => {
                    const Icon = sport.icon;

                    return (
                      <span key={sport.value}>
                        <Icon aria-hidden="true" />
                        {sport.shortLabel}
                      </span>
                    );
                  },
                )}
              </div>
            </div>

            <div className={styles.heroStats}>
              {quickStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`${styles.heroStat} ${stat.tone}`}
                  >
                    <span>
                      <Icon aria-hidden="true" />
                    </span>
                    <div>
                      <p>{stat.label}</p>
                      <strong>{stat.value}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.formIntro}>
          <div>
            <p>Nouvelle entrée</p>
            <h2>
              {isPlanning
                ? "Construisez votre séance"
                : "Consignez votre performance"}
            </h2>
            <span>
              Le formulaire s’adapte automatiquement au
              statut choisi.
            </span>
          </div>

          <div className={styles.formIntroIcon}>
            <Mountain aria-hidden="true" />
          </div>
        </div>

        <CreateActivityForm />
      </div>
    </DashboardLayout>
  );
}
