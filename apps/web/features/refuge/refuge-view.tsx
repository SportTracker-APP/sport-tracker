"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import {
  ArrowRight,
  Award,
  CalendarDays,
  Clock3,
  Flag,
  Link2,
  MapPin,
  Mountain,
  Plus,
  Route,
  TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useActivities } from "@/hooks/use-activities";
import { useGoals } from "@/hooks/use-goals";
import { useSummitBadges, useSummits } from "@/hooks/use-summits";

import { createRefugeViewModel } from "./refuge-mappers";
import styles from "./refuge.module.css";

function HeaderMountain() {
  return (
    <svg
      className={styles.headerMountain}
      viewBox="0 0 620 230"
      role="img"
      aria-label="Illustration d’un itinéraire vers un sommet"
      fill="none"
    >
      <defs>
        <linearGradient
          id="refuge-mountain-fade"
          x1="310"
          y1="12"
          x2="310"
          y2="224"
        >
          <stop stopColor="#879486" stopOpacity=".3" />
          <stop offset="1" stopColor="#a8b19f" stopOpacity=".025" />
        </linearGradient>
      </defs>
      <path
        d="M20 220 108 172l42 20 88-112 36 49 58-77 53 73 46-47 58 75 42-31 70 98H20Z"
        fill="url(#refuge-mountain-fade)"
      />
      <path
        d="m238 80 36 49 58-77 53 73 46-47 58 75"
        stroke="#667468"
        strokeOpacity=".14"
      />
      <path
        className={styles.mountainRoute}
        d="M150 192c22-8 37-27 48-51 12-25 25-46 40-61 13 15 23 33 36 49 15-12 25-39 39-59 8-11 14-17 19-18"
        stroke="#c85b2f"
        strokeWidth="2.5"
        strokeDasharray="5 7"
        strokeLinecap="round"
      />
      <circle cx="150" cy="192" r="4" fill="#c85b2f" />
      <circle cx="238" cy="80" r="3.25" fill="#c85b2f" />
      <circle cx="332" cy="52" r="3.5" fill="#c85b2f" />
      <path
        className={styles.summitFlag}
        d="M332 52V18m0 0 16 7-16 7"
        stroke="#2f5d46"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M100 173v-22m-9 22 9-22 10 22m9 1v-30m-12 30 12-30 13 30"
        stroke="#667468"
        strokeOpacity=".22"
      />
    </svg>
  );
}

function PanelSkeleton({ className }: { className: string }) {
  return (
    <div
      className={`${styles.panelSkeleton} ${className}`}
      aria-label="Chargement de cette partie du refuge"
      aria-busy="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.inlineError} role="alert">
      <Mountain aria-hidden="true" />
      <div>
        <strong>Le chemin s’est momentanément interrompu.</strong>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      className={styles.progressTrack}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export default function RefugeView() {
  const activitiesQuery = useActivities();
  const goalsQuery = useGoals();
  const summitsQuery = useSummits();
  const badgesQuery = useSummitBadges();

  const viewModel = useMemo(
    () =>
      createRefugeViewModel({
        activities: activitiesQuery.data ?? [],
        goals: goalsQuery.data ?? [],
        summits: summitsQuery.data ?? [],
        badges: badgesQuery.data ?? [],
      }),
    [
      activitiesQuery.data,
      badgesQuery.data,
      goalsQuery.data,
      summitsQuery.data,
    ],
  );

  const hasError =
    activitiesQuery.isError ||
    goalsQuery.isError ||
    summitsQuery.isError ||
    badgesQuery.isError;

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        <header className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" /> Refuge
            </p>
            <h1>Refuge</h1>
            <p>
              Ton point de départ pour explorer, te dépasser et garder une trace
              de tes aventures.
            </p>
            <div className={styles.quickActions} aria-label="Actions rapides">
              <Link href="/activites/nouvelle">
                <Plus aria-hidden="true" /> Tracer une sortie
              </Link>
              <Link href="/integrations/strava">
                <Link2 aria-hidden="true" /> Synchroniser Strava
              </Link>
            </div>
          </div>
          <HeaderMountain />
        </header>

        {hasError ? (
          <div className={styles.error} role="status">
            <span>
              Une partie de ton carnet n’a pas pu être chargée. Les autres
              données restent disponibles.
            </span>
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  activitiesQuery.refetch(),
                  goalsQuery.refetch(),
                  summitsQuery.refetch(),
                  badgesQuery.refetch(),
                ]);
              }}
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {activitiesQuery.isLoading ||
        summitsQuery.isLoading ||
        badgesQuery.isLoading ? (
          <PanelSkeleton className={styles.statsSkeleton} />
        ) : (
          <section className={styles.statsStrip} aria-label="Aperçu du carnet">
            <div className={styles.statItem}>
              <Route aria-hidden="true" />
              <div>
                <strong>
                  {activitiesQuery.isError ? "—" : viewModel.activityCount}
                </strong>
                <span>Sorties</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <Mountain aria-hidden="true" />
              <div>
                <strong>
                  {summitsQuery.isError ? "—" : viewModel.summitCount}
                </strong>
                <span>Sommets validés</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <Award aria-hidden="true" />
              <div>
                <strong>
                  {badgesQuery.isError ? "—" : viewModel.badgeCount}
                </strong>
                <span>Badges</span>
              </div>
            </div>
            <div className={`${styles.statItem} ${styles.progressStat}`}>
              <div className={styles.progressHeading}>
                <div>
                  <strong>
                    {summitsQuery.isError
                      ? "—"
                      : `${viewModel.carnetProgress} %`}
                  </strong>
                  <span>Progression du carnet</span>
                </div>
              </div>
              <ProgressBar
                value={summitsQuery.isError ? 0 : viewModel.carnetProgress}
                label="Progression du carnet"
              />
            </div>
          </section>
        )}

        <div className={styles.dashboardGrid}>
          {summitsQuery.isLoading ? (
            <PanelSkeleton className={styles.discoverySkeleton} />
          ) : summitsQuery.isError ? (
            <section className={styles.discoveryCard}>
              <InlineError
                message="Tes sommets ne peuvent pas être affichés pour le moment."
                onRetry={() => void summitsQuery.refetch()}
              />
            </section>
          ) : (
            <section className={styles.discoveryCard}>
              {viewModel.latestSummit ? (
                <>
                  <div className={styles.discoveryCopy}>
                    <span className={styles.pill}>Dernière découverte</span>
                    <h2>{viewModel.latestSummit.name}</h2>
                    <p className={styles.discoveryMeta}>
                      {viewModel.latestSummit.altitude} ·{" "}
                      {viewModel.latestSummit.massif}
                    </p>
                    <p>{viewModel.latestSummit.description}</p>
                    <Link href="/sommets" className={styles.outlineButton}>
                      Voir la fiche sommet <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                  <div className={styles.discoveryImage}>
                    <Image
                      src={viewModel.latestSummit.imageUrl}
                      alt={`Paysage autour de ${viewModel.latestSummit.name}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover"
                    />
                    <div className={styles.discoveryImageShade} />
                    <div className={styles.imageDots} aria-hidden="true">
                      <span className={styles.activeDot} />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.discoveryEmpty}>
                  <span className={styles.pill}>Prochaine découverte</span>
                  <Mountain aria-hidden="true" />
                  <h2>Ton premier sommet t’attend.</h2>
                  <p>
                    Synchronise une sortie ou explore le catalogue pour faire
                    entrer une première crête dans ton carnet.
                  </p>
                  <Link href="/sommets" className={styles.outlineButton}>
                    Explorer les sommets <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>
          )}

          {summitsQuery.isLoading || badgesQuery.isLoading ? (
            <PanelSkeleton className={styles.carnetSkeleton} />
          ) : summitsQuery.isError || badgesQuery.isError ? (
            <section className={styles.carnetCard}>
              <InlineError
                message="La progression de ton carnet n’est pas disponible."
                onRetry={() => {
                  void Promise.all([
                    summitsQuery.refetch(),
                    badgesQuery.refetch(),
                  ]);
                }}
              />
            </section>
          ) : (
            <section className={styles.carnetCard}>
              <div className={styles.sectionKicker}>
                <TrendingUp aria-hidden="true" /> Ton carnet progresse
              </div>
              <p>
                Continue comme ça, chaque trace te rapproche de ton prochain
                objectif.
              </p>
              <div className={styles.globalProgress}>
                <div>
                  <span>Progression globale</span>
                  <strong>{viewModel.carnetProgress} %</strong>
                </div>
                <span>Objectif : 50 %</span>
              </div>
              <ProgressBar
                value={viewModel.carnetProgress}
                label="Progression globale du carnet"
              />
              <div className={styles.nextStep}>
                <div>
                  <span>Prochain palier</span>
                  <strong>
                    {viewModel.nextBadge?.name ?? "10 sommets validés"}
                  </strong>
                  <p>
                    {viewModel.nextBadge?.remainingLabel ??
                      "Ton prochain badge se dessinera au fil de tes traces."}
                  </p>
                </div>
                <Award aria-hidden="true" />
              </div>
              <Link href="/badges" className={styles.textLink}>
                Voir ma collection <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          )}

          {activitiesQuery.isLoading ? (
            <PanelSkeleton className={styles.outingsSkeleton} />
          ) : activitiesQuery.isError ? (
            <section className={styles.outingsCard}>
              <InlineError
                message="Tes dernières sorties ne peuvent pas être affichées."
                onRetry={() => void activitiesQuery.refetch()}
              />
            </section>
          ) : (
            <section className={styles.outingsCard}>
              <div className={styles.cardHeading}>
                <h2>Tes dernières sorties</h2>
                <Link href="/activites">
                  Voir toutes mes sorties <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              {viewModel.recentActivities.length > 0 ? (
                <div className={styles.outingList}>
                  {viewModel.recentActivities.map((activity) => (
                    <Link
                      href={`/activites/${activity.id}`}
                      key={activity.id}
                      className={styles.outingRow}
                    >
                      <span className={styles.outingThumb}>
                        <Image
                          src={activity.imageUrl}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                      <span className={styles.outingName}>
                        <strong>{activity.title}</strong>
                        <small>{activity.place}</small>
                      </span>
                      <span>
                        <CalendarDays aria-hidden="true" /> {activity.date}
                      </span>
                      <span>
                        <MapPin aria-hidden="true" /> {activity.distance}
                      </span>
                      <span>
                        <Mountain aria-hidden="true" /> {activity.elevation}
                      </span>
                      <ArrowRight
                        className={styles.rowArrow}
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.outingsEmpty}>
                  <Route aria-hidden="true" />
                  <div>
                    <strong>Ta première trace ouvrira le chemin.</strong>
                    <p>
                      Connecte Strava pour retrouver automatiquement tes
                      sorties.
                    </p>
                  </div>
                  <Link href="/integrations/strava">Connecter Strava</Link>
                </div>
              )}
            </section>
          )}

          {goalsQuery.isLoading || activitiesQuery.isLoading ? (
            <PanelSkeleton className={styles.challengeSkeleton} />
          ) : goalsQuery.isError || activitiesQuery.isError ? (
            <section className={styles.challengeCard}>
              <InlineError
                message="Ton défi du moment n’est pas disponible."
                onRetry={() => {
                  void Promise.all([
                    goalsQuery.refetch(),
                    activitiesQuery.refetch(),
                  ]);
                }}
              />
            </section>
          ) : (
            <section className={styles.challengeCard}>
              <div className={styles.sectionKicker}>
                <Mountain aria-hidden="true" /> Défi du moment
              </div>
              <h2>{viewModel.challenge.title}</h2>
              <p>{viewModel.challenge.description}</p>
              <span className={styles.challengeStatus}>
                {viewModel.challenge.completed ? "Terminé" : "En cours"}
              </span>
              <div className={styles.challengeLandscape} aria-hidden="true">
                <span />
                <span />
                <span />
                <Flag />
              </div>
              <div className={styles.challengeFooter}>
                <div>
                  <Route aria-hidden="true" />
                  <strong>
                    {viewModel.challenge.currentLabel} /{" "}
                    {viewModel.challenge.targetLabel}
                  </strong>
                  <span>Progression</span>
                </div>
                <div>
                  <Clock3 aria-hidden="true" />
                  <strong>{viewModel.challenge.deadlineLabel}</strong>
                  <span>Restants</span>
                </div>
              </div>
              <Link
                href="/objectifs"
                aria-label="Voir le défi"
                className={styles.challengeLink}
              />
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
