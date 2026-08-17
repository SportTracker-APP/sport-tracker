"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import {
  ArrowRight,
  Award,
  BookOpen,
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

import {
  createRefugeViewModel,
  type RefugePrimaryAction,
} from "./refuge-mappers";
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

function StoryEventIcon({
  kind,
}: {
  kind: "activity" | "summit" | "badge" | "progress";
}) {
  if (kind === "activity") {
    return <Route aria-hidden="true" />;
  }

  if (kind === "summit") {
    return <Mountain aria-hidden="true" />;
  }

  if (kind === "badge") {
    return <Award aria-hidden="true" />;
  }

  return <TrendingUp aria-hidden="true" />;
}

function PrimaryActionIcon({ kind }: { kind: RefugePrimaryAction["kind"] }) {
  if (kind === "discovery") {
    return <Mountain aria-hidden="true" />;
  }

  if (kind === "plan") {
    return <CalendarDays aria-hidden="true" />;
  }

  if (kind === "explore") {
    return <MapPin aria-hidden="true" />;
  }

  return <Link2 aria-hidden="true" />;
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
  const isPrimaryActionLoading =
    activitiesQuery.isLoading || summitsQuery.isLoading;

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        <header className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" /> Refuge
            </p>
            <h1>Refuge</h1>
            <p>{viewModel.welcomeMessage}</p>
            {isPrimaryActionLoading ? (
              <div
                className={styles.primaryActionSkeleton}
                aria-label="Recherche de la prochaine étape"
                aria-busy="true"
              >
                <span />
                <span />
              </div>
            ) : (
              <div className={styles.actionContext} aria-live="polite">
                <p>
                  <span>{viewModel.primaryAction.contextLabel}</span>
                  {viewModel.primaryAction.description}
                </p>
                <div
                  className={styles.quickActions}
                  aria-label="Action recommandée"
                >
                  <Link
                    href={viewModel.primaryAction.href}
                    className={styles.primaryAction}
                  >
                    <PrimaryActionIcon kind={viewModel.primaryAction.kind} />
                    <span>{viewModel.primaryAction.label}</span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    href="/activites/nouvelle"
                    className={styles.secondaryAction}
                  >
                    <Plus aria-hidden="true" /> Tracer une sortie
                  </Link>
                </div>
              </div>
            )}
          </div>
          <HeaderMountain />
        </header>

        {hasError ? (
          <div className={styles.error} role="alert">
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
          {summitsQuery.isLoading || badgesQuery.isLoading ? (
            <PanelSkeleton className={styles.masterpieceSkeleton} />
          ) : summitsQuery.isError || badgesQuery.isError ? (
            <section className={styles.masterpieceCard}>
              <InlineError
                message="Ta dernière découverte et la progression de ton carnet ne sont pas disponibles."
                onRetry={() => {
                  void Promise.all([
                    summitsQuery.refetch(),
                    badgesQuery.refetch(),
                  ]);
                }}
              />
            </section>
          ) : (
            <section
              className={styles.masterpieceCard}
              aria-labelledby="refuge-masterpiece-title"
            >
              <div className={styles.masterpieceStory}>
                {viewModel.latestSummit ? (
                  <>
                    <div className={styles.discoveryCopy}>
                      <span className={styles.pill}>Dernière découverte</span>
                      <h2 id="refuge-masterpiece-title">
                        {viewModel.latestSummit.name}
                      </h2>
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
                        alt={`Paysage de montagne sélectionné pour ${viewModel.latestSummit.name}`}
                        fill
                        sizes="(max-width: 900px) 100vw, 48vw"
                        className="object-cover"
                      />
                      <div className={styles.discoveryImageShade} />
                      <span className={styles.discoveryStamp}>
                        Sommet
                        <br />
                        validé
                      </span>
                    </div>
                  </>
                ) : (
                  <div className={styles.discoveryEmpty}>
                    <span className={styles.pill}>Prochaine découverte</span>
                    <Mountain aria-hidden="true" />
                    <h2 id="refuge-masterpiece-title">
                      Ton premier sommet t’attend.
                    </h2>
                    <p>
                      Synchronise une sortie ou explore le catalogue pour faire
                      entrer une première crête dans ton carnet.
                    </p>
                    <Link href="/sommets" className={styles.outlineButton}>
                      Explorer les sommets <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>

              <aside
                className={styles.masterpieceProgress}
                aria-label="Progression du carnet"
              >
                <div className={styles.sectionKicker}>
                  <TrendingUp aria-hidden="true" /> Ton carnet progresse
                </div>
                <p>
                  {viewModel.latestSummit
                    ? "Cette découverte enrichit ton histoire et te rapproche du prochain palier."
                    : "Chaque future trace fera grandir ici ta collection de sommets."}
                </p>

                <div className={styles.collectionBadge}>
                  <div className={styles.collectionBadgeHeading}>
                    <div>
                      <span>Prochain badge</span>
                      <strong>
                        {viewModel.nextBadge?.name ?? "Premier palier"}
                      </strong>
                      {viewModel.nextBadge ? (
                        <p className={styles.collectionBadgeCriterion}>
                          Objectif : {viewModel.nextBadge.criterionLabel}
                        </p>
                      ) : null}
                    </div>
                    <Award aria-hidden="true" />
                  </div>
                  <div className={styles.collectionProgressHeading}>
                    <strong>
                      {viewModel.nextBadge?.progressLabel ??
                        `${viewModel.summitCount} sommets`}
                    </strong>
                    <span>
                      {viewModel.nextBadge?.remainingLabel ??
                        "Ta collection commence avec ta prochaine trace."}
                    </span>
                  </div>
                  <ProgressBar
                    value={viewModel.nextBadge?.progress ?? 0}
                    label="Progression vers le prochain badge"
                  />
                </div>

                {viewModel.latestMilestone ? (
                  <p className={styles.milestoneNote}>
                    <Award aria-hidden="true" />
                    <span>
                      Palier franchi
                      <strong>{viewModel.latestMilestone.name}</strong>
                    </span>
                    <time>{viewModel.latestMilestone.date}</time>
                  </p>
                ) : null}

                {viewModel.strongestMassif || viewModel.nextZone ? (
                  <div
                    className={styles.collectionTerritories}
                    aria-label="Repères de ta collection"
                  >
                    {viewModel.strongestMassif ? (
                      <Link href="/sommets" className={styles.territoryItem}>
                        <MapPin aria-hidden="true" />
                        <span>
                          <small>Massif le plus exploré</small>
                          <strong>{viewModel.strongestMassif.name}</strong>
                          <span>{viewModel.strongestMassif.countLabel}</span>
                        </span>
                      </Link>
                    ) : null}
                    {viewModel.nextZone ? (
                      <Link href="/sommets" className={styles.territoryItem}>
                        <Flag aria-hidden="true" />
                        <span>
                          <small>Prochaine zone à compléter</small>
                          <strong>{viewModel.nextZone.name}</strong>
                          <span>{viewModel.nextZone.countLabel}</span>
                        </span>
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                <div className={styles.masterpieceLinks}>
                  <Link href="/sommets" className={styles.textLink}>
                    Ouvrir mon carnet <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link href="/badges" className={styles.textLink}>
                    Voir mes badges <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </aside>
            </section>
          )}

          {activitiesQuery.isLoading ||
          summitsQuery.isLoading ||
          badgesQuery.isLoading ? (
            <PanelSkeleton className={styles.storylineSkeleton} />
          ) : activitiesQuery.isError ||
            summitsQuery.isError ||
            badgesQuery.isError ? (
            <section className={styles.storylineCard}>
              <InlineError
                message="Le fil de ton carnet ne peut pas être reconstitué pour le moment."
                onRetry={() => {
                  void Promise.all([
                    activitiesQuery.refetch(),
                    summitsQuery.refetch(),
                    badgesQuery.refetch(),
                  ]);
                }}
              />
            </section>
          ) : viewModel.storyEvents.length > 0 ? (
            <section
              className={styles.storylineCard}
              aria-labelledby="refuge-storyline-title"
            >
              <header className={styles.storylineHeading}>
                <div>
                  <p className={styles.storylineKicker}>
                    <BookOpen aria-hidden="true" /> Le fil du carnet
                  </p>
                  <h2 id="refuge-storyline-title">
                    Ce que tes dernières traces ont révélé.
                  </h2>
                </div>
                <Link href="/sommets">
                  Ouvrir mon carnet <ArrowRight aria-hidden="true" />
                </Link>
              </header>

              <div className={styles.storylineTrack}>
                {viewModel.storyEvents.map((event) => (
                  <Link
                    href={event.href}
                    key={event.id}
                    className={styles.storyEvent}
                  >
                    <time>{event.date}</time>
                    <span
                      className={`${styles.storyMarker} ${styles[`storyMarker${event.kind}`]}`}
                    >
                      <StoryEventIcon kind={event.kind} />
                    </span>
                    <span className={styles.storyCopy}>
                      <small>{event.label}</small>
                      <strong>{event.title}</strong>
                      <span>{event.description}</span>
                    </span>
                    <ArrowRight
                      className={styles.storyArrow}
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className={styles.storylineEmpty}>
              <span className={styles.storyMarker}>
                <Route aria-hidden="true" />
              </span>
              <div>
                <p className={styles.storylineKicker}>Le fil du carnet</p>
                <h2>Ta première trace écrira le début de l’histoire.</h2>
                <p>
                  Connecte Strava ou ajoute une sortie pour faire apparaître ici
                  tes découvertes, tes badges et ta progression.
                </p>
              </div>
              <Link href="/integrations/strava">
                Connecter Strava <ArrowRight aria-hidden="true" />
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
                <h2>{viewModel.recentActivitiesCopy.heading}</h2>
                <Link href="/activites">
                  {viewModel.recentActivitiesCopy.linkLabel}{" "}
                  <ArrowRight aria-hidden="true" />
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
