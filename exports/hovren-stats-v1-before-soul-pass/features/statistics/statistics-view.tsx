"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  Award,
  Bike,
  BookOpen,
  CalendarDays,
  Clock3,
  Dumbbell,
  Footprints,
  Gauge,
  MapPin,
  Mountain,
  RefreshCw,
  Route,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { ActivityPeriodSelect } from "@/components/dashboard/activity-period-select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";
import {
  ACTIVITY_CHART_PERIOD_STORAGE_KEY,
  getActivityChartSummary,
  isActivityChartPeriod,
  type ActivityChartPeriod,
} from "@/lib/activity-chart-period";
import type { Activity as SportActivity } from "@/lib/activities";

import { StatisticsCalendar } from "./statistics-calendar";
import {
  StatisticsChart,
  type StatisticsChartMetric,
} from "./statistics-chart";
import {
  getActiveDayCount,
  getCalendarDays,
  getCompletedActivities,
  getHighestAltitudeActivity,
  getHighestElevationActivity,
  getLongestDistanceActivity,
  getPeriodComparison,
  getPeriodNarrative,
  getSportDistribution,
  getTrendPercent,
  sumActivities,
} from "./statistics-utils";
import styles from "./statistics.module.css";

function formatDistance(value: number | null | undefined) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(value ?? 0)} km`;
}

function formatElevation(value: number | null | undefined) {
  return `${Math.round(value ?? 0).toLocaleString("fr-FR")} m`;
}

function formatDuration(minutes: number | null | undefined) {
  const safeMinutes = Math.max(0, Math.round(minutes ?? 0));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  return remainingMinutes > 0
    ? `${hours} h ${String(remainingMinutes).padStart(2, "0")}`
    : `${hours} h`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getActivityTitle(activity: SportActivity | null) {
  return activity?.title?.trim() || "Une trace sans titre";
}

function SportIcon({ sport }: { sport: string }) {
  if (sport === "MTB" || sport === "ROAD_CYCLING" || sport === "GRAVEL") {
    return <Bike aria-hidden="true" />;
  }

  if (sport === "FITNESS") {
    return <Dumbbell aria-hidden="true" />;
  }

  if (sport === "HIKING" || sport === "WALKING") {
    return <Footprints aria-hidden="true" />;
  }

  if (sport === "TRAIL") {
    return <Mountain aria-hidden="true" />;
  }

  return <Activity aria-hidden="true" />;
}

function StatisticsHeroIllustration() {
  return (
    <svg
      className={styles.heroIllustration}
      viewBox="0 0 760 300"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M32 262 149 151l75 68L353 57l103 125 65-57 94 91 77-54 52 100H32Z"
        fill="#aab7a5"
        fillOpacity=".22"
      />
      <path
        d="M32 262 180 197l80 52 132-112 104 91 78-55 170 89H32Z"
        fill="#667468"
        fillOpacity=".11"
      />
      <path
        d="M48 226c68-18 94-72 144-72 61 0 70 47 128 47 66 0 81-98 145-98 58 0 85 58 137 58 42 0 69-32 106-43"
        stroke="#2f5d46"
        strokeOpacity=".2"
        strokeWidth="1.5"
      />
      <path
        d="M48 245c88-16 103-58 152-58 62 0 87 45 140 45 69 0 85-91 147-91 45 0 77 44 124 44 36 0 63-22 97-38"
        stroke="#2f5d46"
        strokeOpacity=".11"
      />
      <path
        d="M69 235c53-22 91-38 131-47 50-11 78 43 133 35 65-9 91-81 147-86 54-5 88 42 133 36"
        stroke="#c85b2f"
        strokeDasharray="5 8"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="69" cy="235" r="4" fill="#c85b2f" />
      <circle cx="200" cy="188" r="4" fill="#2f5d46" />
      <circle cx="333" cy="223" r="4" fill="#2f5d46" />
      <circle cx="480" cy="137" r="5" fill="#c85b2f" />
      <circle cx="613" cy="173" r="4" fill="#2f5d46" />
      <path
        d="M118 92c38-48 99-48 137 0-38 48-99 48-137 0Z"
        stroke="#2f5d46"
        strokeOpacity=".1"
      />
      <path
        d="M137 92c27-33 72-33 99 0-27 33-72 33-99 0Z"
        stroke="#2f5d46"
        strokeOpacity=".13"
      />
      <path
        d="M524 72c28-36 75-36 103 0-28 36-75 36-103 0Z"
        stroke="#2f5d46"
        strokeOpacity=".1"
      />
    </svg>
  );
}

function LoadingState() {
  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page} aria-busy="true" aria-label="Chargement du bilan">
        <div className={styles.loadingHero}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.loadingGrid}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyArtwork} aria-hidden="true">
        <StatisticsHeroIllustration />
      </div>
      <div>
        <span className={styles.eyebrow}>
          <BookOpen aria-hidden="true" />
          Première page
        </span>
        <h1>Ton bilan prendra forme dès ta première activité.</h1>
        <p>
          Synchronise Strava ou ajoute une activité pour révéler ton rythme,
          tes terrains favoris et les repères qui racontent ton exploration.
        </p>
        <div className={styles.emptyActions}>
          <Link href="/integrations/strava" className={styles.primaryButton}>
            Synchroniser Strava
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/activites/nouvelle" className={styles.secondaryButton}>
            Ajouter une activité
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StatisticsView() {
  const activitiesQuery = useActivities();
  const [period, setPeriod] = useState<ActivityChartPeriod>(() => {
    if (typeof window === "undefined") {
      return "30d";
    }

    const storedPeriod = window.localStorage.getItem(
      ACTIVITY_CHART_PERIOD_STORAGE_KEY,
    );

    return isActivityChartPeriod(storedPeriod) ? storedPeriod : "30d";
  });
  const [metric, setMetric] =
    useState<StatisticsChartMetric>("distance");

  const completedActivities = useMemo(
    () => getCompletedActivities(activitiesQuery.data ?? []),
    [activitiesQuery.data],
  );
  const sortedActivities = useMemo(
    () =>
      [...completedActivities].sort(
        (first, second) =>
          new Date(second.startedAt).getTime() -
          new Date(first.startedAt).getTime(),
      ),
    [completedActivities],
  );
  const summary = useMemo(
    () => getActivityChartSummary(completedActivities, period),
    [completedActivities, period],
  );
  const comparison = useMemo(
    () => getPeriodComparison(completedActivities, period),
    [completedActivities, period],
  );
  const allTimeTotals = useMemo(
    () => sumActivities(completedActivities),
    [completedActivities],
  );
  const distribution = useMemo(
    () => getSportDistribution(summary.periodActivities),
    [summary.periodActivities],
  );
  const activeDays = useMemo(
    () => getActiveDayCount(summary.periodActivities),
    [summary.periodActivities],
  );
  const calendarDays = useMemo(
    () => getCalendarDays(completedActivities),
    [completedActivities],
  );
  const distanceTrend = getTrendPercent(
    comparison.current.distance,
    comparison.previous.distance,
  );
  const narrative = getPeriodNarrative({
    totals: comparison.current,
    activeDays,
    dominantSport: distribution[0] ?? null,
    trendPercent: distanceTrend,
  });
  const longestActivity = getLongestDistanceActivity(completedActivities);
  const climbingActivity = getHighestElevationActivity(completedActivities);
  const altitudeActivity = getHighestAltitudeActivity(completedActivities);
  const latestActivity = sortedActivities[0] ?? null;

  const handlePeriodChange = (nextPeriod: ActivityChartPeriod) => {
    setPeriod(nextPeriod);
    window.localStorage.setItem(
      ACTIVITY_CHART_PERIOD_STORAGE_KEY,
      nextPeriod,
    );
  };

  if (activitiesQuery.isPending) {
    return <LoadingState />;
  }

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        {activitiesQuery.isError ? (
          <div className={styles.errorState} role="alert">
            <Mountain aria-hidden="true" />
            <div>
              <strong>Le bilan n’a pas pu rejoindre le carnet.</strong>
              <p>
                Tes activités sont intactes. Réessaie simplement de charger
                cette page.
              </p>
            </div>
            <button type="button" onClick={() => void activitiesQuery.refetch()}>
              <RefreshCw aria-hidden="true" />
              Réessayer
            </button>
          </div>
        ) : completedActivities.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section className={styles.hero} aria-labelledby="statistics-title">
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}>
                  <BookOpen aria-hidden="true" />
                  Bilan d’exploration
                </span>
                <h1 id="statistics-title">Ton bilan prend du relief.</h1>
                <p>
                  Chaque trace laisse un repère. Ici, ton rythme, tes terrains
                  et tes plus beaux efforts racontent la même histoire.
                </p>
                <ActivityPeriodSelect
                  className={styles.periodSelect}
                  value={period}
                  onChange={handlePeriodChange}
                />
              </div>

              <div className={styles.heroStory}>
                <StatisticsHeroIllustration />
                <div className={styles.heroStatement}>
                  <strong>
                    {summary.periodActivities.length.toLocaleString("fr-FR")}
                  </strong>
                  <span>
                    activité{summary.periodActivities.length > 1 ? "s" : ""} ont
                    dessiné
                  </span>
                  <strong>{formatDistance(summary.totalDistance)}</strong>
                  <span>sur {summary.configuration.label.toLowerCase()}</span>
                </div>
              </div>

              <div className={styles.heroMetrics}>
                <div>
                  <Route aria-hidden="true" />
                  <span>
                    <strong>{formatDistance(summary.totalDistance)}</strong>
                    Distance parcourue
                  </span>
                </div>
                <div>
                  <Clock3 aria-hidden="true" />
                  <span>
                    <strong>{formatDuration(summary.totalDuration)}</strong>
                    Temps en mouvement
                  </span>
                </div>
                <div>
                  <Mountain aria-hidden="true" />
                  <span>
                    <strong>{formatElevation(summary.totalElevation)}</strong>
                    Dénivelé positif
                  </span>
                </div>
                <div>
                  {distanceTrend >= 0 ? (
                    <TrendingUp aria-hidden="true" />
                  ) : (
                    <TrendingDown aria-hidden="true" />
                  )}
                  <span>
                    <strong>
                      {distanceTrend > 0 ? "+" : ""}
                      {distanceTrend} %
                    </strong>
                    Période précédente
                  </span>
                </div>
              </div>
            </section>

            <section
              className={styles.readingSection}
              aria-labelledby="reading-heading"
            >
              <div className={styles.sectionHeading}>
                <span className={styles.eyebrow}>
                  <Sparkles aria-hidden="true" />
                  Lecture du terrain
                </span>
                <h2 id="reading-heading">Ce que tes sorties disent de toi.</h2>
                <p>
                  Une lecture simple de la période, construite uniquement à
                  partir de tes activités.
                </p>
              </div>

              <div className={styles.insightGrid}>
                <article className={styles.insightLead}>
                  <span className={styles.insightIndex}>01</span>
                  <Mountain aria-hidden="true" />
                  <div>
                    <small>Relief</small>
                    <h3>{narrative.terrain}</h3>
                    <p>
                      {formatElevation(summary.totalElevation)} gravis sur la
                      période.
                    </p>
                  </div>
                </article>
                <article>
                  <span className={styles.insightIndex}>02</span>
                  <CalendarDays aria-hidden="true" />
                  <div>
                    <small>Régularité</small>
                    <h3>{narrative.rhythm}</h3>
                    <p>{narrative.comparison}</p>
                  </div>
                </article>
                <article>
                  <span className={styles.insightIndex}>03</span>
                  <Activity aria-hidden="true" />
                  <div>
                    <small>Terrain favori</small>
                    <h3>{narrative.mix}</h3>
                    <p>
                      {distribution.length} discipline
                      {distribution.length > 1 ? "s" : ""} dans ce chapitre.
                    </p>
                  </div>
                </article>
              </div>
            </section>

            <section className={styles.mixSection} aria-labelledby="mix-heading">
              <div className={styles.sectionHeadingCompact}>
                <span className={styles.eyebrow}>
                  <Footprints aria-hidden="true" />
                  Mix outdoor
                </span>
                <h2 id="mix-heading">Les disciplines qui façonnent ton carnet.</h2>
                <p>Répartition des activités sur la période choisie.</p>
              </div>

              <div className={styles.mixList}>
                {distribution.length > 0 ? (
                  distribution.slice(0, 6).map((entry, index) => (
                    <div className={styles.mixRow} key={entry.sport}>
                      <span className={styles.mixRank}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.mixIcon}>
                        <SportIcon sport={entry.sport} />
                      </span>
                      <span className={styles.mixName}>
                        <strong>{entry.label}</strong>
                        {entry.count} activité{entry.count > 1 ? "s" : ""} ·{" "}
                        {formatDistance(entry.distance)}
                      </span>
                      <span className={styles.mixBar} aria-hidden="true">
                        <i style={{ width: `${entry.percent}%` }} />
                      </span>
                      <strong className={styles.mixPercent}>
                        {entry.percent} %
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className={styles.subtleEmpty}>
                    Aucune activité sur cette période. Change de période pour
                    retrouver un chapitre plus rempli.
                  </p>
                )}
              </div>
            </section>

            <section
              className={styles.activitySection}
              aria-labelledby="activity-heading"
            >
              <div className={styles.activityHeader}>
                <div className={styles.sectionHeadingCompact}>
                  <span className={styles.eyebrow}>
                    <TrendingUp aria-hidden="true" />
                    Activité sur la période
                  </span>
                  <h2 id="activity-heading">
                    La ligne de ton exploration.
                  </h2>
                  <p>
                    {summary.configuration.granularityLabel
                      .charAt(0)
                      .toUpperCase() +
                      summary.configuration.granularityLabel.slice(1)}
                    , sans perdre le fil.
                  </p>
                </div>

                <div
                  className={styles.metricTabs}
                  role="group"
                  aria-label="Mesure affichée sur le graphique"
                >
                  {(
                    [
                      ["distance", "Distance"],
                      ["elevation", "Dénivelé"],
                      ["duration", "Durée"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={metric === value}
                      onClick={() => setMetric(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <StatisticsChart data={summary.chartData} metric={metric} />
            </section>

            <div className={styles.rhythmGrid}>
              <StatisticsCalendar days={calendarDays} />

              <section
                className={styles.highlightsPanel}
                aria-labelledby="highlights-heading"
              >
                <div className={styles.sectionHeadingCompact}>
                  <span className={styles.eyebrow}>
                    <Award aria-hidden="true" />
                    Repères marquants
                  </span>
                  <h2 id="highlights-heading">Les traces qui restent.</h2>
                  <p>Records observés dans l’ensemble de ton carnet.</p>
                </div>

                <div className={styles.recordList}>
                  <Link
                    href={
                      longestActivity
                        ? `/activities/${longestActivity.id}`
                        : "/activites"
                    }
                  >
                    <Route aria-hidden="true" />
                    <span>
                      <small>Plus longue trace</small>
                      <strong>
                        {formatDistance(longestActivity?.distance)}
                      </strong>
                      {getActivityTitle(longestActivity)}
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    href={
                      climbingActivity
                        ? `/activities/${climbingActivity.id}`
                        : "/activites"
                    }
                  >
                    <TrendingUp aria-hidden="true" />
                    <span>
                      <small>Plus grand dénivelé</small>
                      <strong>
                        {formatElevation(climbingActivity?.elevationGain)}
                      </strong>
                      {getActivityTitle(climbingActivity)}
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    href={
                      altitudeActivity
                        ? `/activities/${altitudeActivity.id}`
                        : "/activites"
                    }
                  >
                    <Mountain aria-hidden="true" />
                    <span>
                      <small>Point culminant</small>
                      <strong>
                        {formatElevation(altitudeActivity?.maxAltitude)}
                      </strong>
                      {getActivityTitle(altitudeActivity)}
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </section>
            </div>

            <section className={styles.refugeNote} aria-labelledby="refuge-note">
              <div className={styles.noteMark} aria-hidden="true">
                <BookOpen />
              </div>
              <div>
                <span className={styles.eyebrow}>Note du refuge</span>
                <h2 id="refuge-note">{narrative.comparison}</h2>
                <p>
                  Depuis la première page de ton carnet, tu as cumulé{" "}
                  {formatDistance(allTimeTotals.distance)},{" "}
                  {formatElevation(allTimeTotals.elevation)} de dénivelé et{" "}
                  {formatDuration(allTimeTotals.duration)} dehors. La suite se
                  construit sans précipitation, une trace après l’autre.
                </p>
              </div>
              <Link href="/defis">
                Voir mes défis
                <ArrowRight aria-hidden="true" />
              </Link>
            </section>

            {latestActivity ? (
              <section
                className={styles.latestSection}
                aria-labelledby="latest-heading"
              >
                <div
                  className={styles.latestVisual}
                  style={
                    latestActivity.coverImageUrl
                      ? {
                          backgroundImage: `linear-gradient(90deg, rgba(32,55,43,.84), rgba(32,55,43,.2)), url("${latestActivity.coverImageUrl}")`,
                        }
                      : undefined
                  }
                >
                  <div className={styles.latestMountain} aria-hidden="true">
                    <StatisticsHeroIllustration />
                  </div>
                  <span>Dernier repère</span>
                  <strong>{formatDate(latestActivity.startedAt)}</strong>
                </div>
                <div className={styles.latestCopy}>
                  <span className={styles.eyebrow}>
                    <MapPin aria-hidden="true" />
                    Dernière activité
                  </span>
                  <h2 id="latest-heading">{getActivityTitle(latestActivity)}</h2>
                  <p>
                    {formatDistance(latestActivity.distance)} ·{" "}
                    {formatDuration(latestActivity.duration)} ·{" "}
                    {formatElevation(latestActivity.elevationGain)} de dénivelé
                  </p>
                  <Link href={`/activities/${latestActivity.id}`}>
                    Ouvrir cette page
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
                <div className={styles.latestSeal} aria-hidden="true">
                  <Gauge />
                  <span>
                    {allTimeTotals.count.toLocaleString("fr-FR")}
                    <small>pages au carnet</small>
                  </span>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
