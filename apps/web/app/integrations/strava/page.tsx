"use client";

import { useEffect, useMemo, useState } from "react";

import type { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Flame,
  Heart,
  Link2,
  Loader2,
  Mountain,
  RefreshCw,
  ShieldCheck,
  Timer,
  Unlink,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { api } from "@/lib/api";

import styles from "./strava.module.css";

interface StravaStatus {
  connected: boolean;
  requiresReconnect?: boolean;
  athleteId?: string;
  expiresAt?: string;
  lastUpdatedAt?: string;
}

interface SyncResult {
  imported: number;
  fetched: number;
  latestImportedActivityTitle: string | null;
}

interface LastSyncedActivity {
  id: string;
  title?: string;
  name?: string;
  sport?: string;
  distance?: number;
  duration?: number;
  elevationGain?: number;
  startedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

type ActivitiesApiResponse =
  | LastSyncedActivity[]
  | {
      activities?: LastSyncedActivity[];
      data?: LastSyncedActivity[];
      items?: LastSyncedActivity[];
    };

type FeedbackVariant = "success" | "warning" | "error" | "neutral";

interface FeedbackMessage {
  text: string;
  variant: FeedbackVariant;
}

const importedData = [
  {
    icon: Activity,
    title: "Traces",
    description: "Courses, vélo, randonnée et plus",
  },
  {
    icon: Timer,
    title: "Temps",
    description: "Durée et temps en mouvement",
  },
  {
    icon: Mountain,
    title: "Dénivelé",
    description: "Ascension et descente",
  },
  {
    icon: Flame,
    title: "Calories",
    description: "Dépense énergétique",
  },
  {
    icon: Heart,
    title: "Fréquence cardiaque",
    description: "Moyenne et maximum",
  },
  {
    icon: ShieldCheck,
    title: "Synchronisation sécurisée",
    description: "Connexion OAuth officielle",
  },
];

const workflowSteps = [
  "Connexion Strava",
  "Autorisation OAuth",
  "Synchronisation",
  "Révélation des traces",
];

const callbackFailureMessages: Record<string, string> = {
  state_invalid:
    "Le retour Strava n'est plus valide. Relancez la connexion depuis HOVREN.",
  token_exchange_failed:
    "Strava a refusé l'échange OAuth. Vérifie surtout le Client Secret et le domaine de rappel.",
  token_payload_invalid:
    "Strava n'a pas renvoyé toutes les informations attendues.",
  database_error:
    "La connexion Strava a été autorisée, mais l'enregistrement en base a échoué.",
};

function getErrorStatus(error: unknown) {
  return (error as AxiosError | undefined)?.response?.status;
}

function getErrorMessage(error: unknown) {
  const data = (error as AxiosError | undefined)?.response?.data as
    | { message?: string | string[] }
    | undefined;

  if (Array.isArray(data?.message)) {
    return data.message.join(" ");
  }

  return data?.message;
}

function extractActivities(response: ActivitiesApiResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  return response.activities || response.data || response.items || [];
}

function isCompletedActivity(activity: LastSyncedActivity) {
  if (!activity.startedAt) {
    return false;
  }

  const startedAt = new Date(activity.startedAt).getTime();

  if (Number.isNaN(startedAt)) {
    return false;
  }

  return (
    startedAt <= Date.now() &&
    typeof activity.duration === "number" &&
    activity.duration > 0
  );
}

function getActivityTitle(activity: LastSyncedActivity) {
  return activity.title || activity.name || "Trace Strava";
}

function formatActivityDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDistance(distance?: number) {
  if (typeof distance !== "number") {
    return null;
  }

  const kilometers = distance > 1000 ? distance / 1000 : distance;

  return `${kilometers.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  })} km`;
}

function formatDuration(duration?: number) {
  if (typeof duration !== "number") {
    return null;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

function formatElevation(elevationGain?: number) {
  if (typeof elevationGain !== "number") {
    return null;
  }

  return `${Math.round(elevationGain).toLocaleString("fr-FR")} m D+`;
}

export default function StravaIntegrationPage() {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StravaStatus>({
    connected: false,
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [isConnecting, setIsConnecting] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [lastSyncedActivity, setLastSyncedActivity] =
    useState<LastSyncedActivity | null>(null);

  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const callbackMessage = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);

    const stravaState = params.get("strava");
    const reason = params.get("reason");

    if (stravaState === "connected") {
      return {
        text: "Compte Strava connecté.",
        variant: "success",
      } satisfies FeedbackMessage;
    }

    if (stravaState === "denied") {
      return {
        text: "Autorisation Strava refusée.",
        variant: "warning",
      } satisfies FeedbackMessage;
    }

    if (stravaState === "error" && reason) {
      return {
        text:
          callbackFailureMessages[reason] ||
          "Connexion Strava impossible pour le moment.",
        variant: "error",
      } satisfies FeedbackMessage;
    }

    if (stravaState === "invalid" || stravaState === "error") {
      return {
        text: "Connexion Strava impossible pour le moment.",
        variant: "error",
      } satisfies FeedbackMessage;
    }

    return null;
  }, []);

  useEffect(() => {
    void refreshStatus();
    void refreshLastSyncedActivity();
  }, []);

  useEffect(() => {
    if (callbackMessage) {
      // Le message dépend du retour OAuth présent dans l’URL au montage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(callbackMessage);
    }
  }, [callbackMessage]);

  async function refreshLastSyncedActivity() {
    try {
      const { data } = await api.get<ActivitiesApiResponse>("/activities");

      const activities = extractActivities(data)
        .filter(isCompletedActivity)
        .sort(
          (activityA, activityB) =>
            new Date(activityB.startedAt || "").getTime() -
            new Date(activityA.startedAt || "").getTime(),
        );

      setLastSyncedActivity(activities[0] || null);
    } catch (error) {
      console.error(error);
      setLastSyncedActivity(null);
    }
  }

  async function refreshStatus() {
    try {
      setIsLoadingStatus(true);

      const { data } = await api.get<StravaStatus>("/strava/status");

      setStatus(data);
      if (data.requiresReconnect) {
        setMessage(
          (currentMessage) =>
            currentMessage ?? {
              text: "La connexion Strava doit être renouvelée. Tes sorties déjà importées sont conservées.",
              variant: "warning",
            },
        );
      }
    } catch (error) {
      console.error(error);

      if (getErrorStatus(error) === 401) {
        setMessage({
          text: "Ta session a expiré. Reconnecte-toi, puis relance la connexion Strava.",
          variant: "warning",
        });

        return;
      }

      setMessage({
        text: "Impossible de vérifier le statut Strava.",
        variant: "error",
      });
    } finally {
      setIsLoadingStatus(false);
    }
  }

  async function connectStrava() {
    try {
      setIsConnecting(true);
      setMessage(null);

      const { data } = await api.get<{
        authorizationUrl: string;
      }>("/strava/connect");

      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error(error);

      if (getErrorStatus(error) === 401) {
        setMessage({
          text: "Ta session a expiré. Reconnecte-toi avant de connecter Strava.",
          variant: "warning",
        });

        return;
      }

      setMessage({
        text: "La connexion Strava n'est pas encore configurée.",
        variant: "error",
      });
    } finally {
      setIsConnecting(false);
    }
  }

  async function syncStrava() {
    try {
      setIsSyncing(true);
      setMessage(null);
      setSyncResult(null);

      const { data } = await api.post<SyncResult>("/strava/sync");

      setSyncResult(data);
      setMessage({
        text:
          data.imported === 0
            ? "Aucune nouvelle sortie à synchroniser."
            : data.imported === 1
              ? `1 sortie synchronisée${data.latestImportedActivityTitle ? ` : ${data.latestImportedActivityTitle}` : ""}.`
              : `${data.imported} sorties synchronisées${data.latestImportedActivityTitle ? `, dont ${data.latestImportedActivityTitle}` : ""}.`,
        variant: "success",
      });

      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["summits"] });
      await queryClient.invalidateQueries({ queryKey: ["summit-badges"] });
      await refreshStatus();
      await refreshLastSyncedActivity();
    } catch (error) {
      console.error(error);

      if (getErrorStatus(error) === 401) {
        setMessage({
          text: "Ta session a expiré. Reconnecte-toi avant de synchroniser Strava.",
          variant: "warning",
        });

        return;
      }

      setMessage({
        text: getErrorMessage(error) || "La synchronisation Strava a échoué.",
        variant: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function disconnectStrava() {
    try {
      setIsDisconnecting(true);
      setMessage(null);

      await api.delete("/strava/disconnect");

      setSyncResult(null);
      setStatus({
        connected: false,
      });
      setMessage({
        text: "Compte Strava déconnecté.",
        variant: "neutral",
      });
    } catch (error) {
      console.error(error);

      setMessage({
        text: "Impossible de déconnecter Strava.",
        variant: "error",
      });
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <Link2 aria-hidden="true" />
              <span>Intégration officielle</span>
            </div>

            <h1>Strava alimente ton carnet</h1>
            <p>
              Importe automatiquement tes activités pour retrouver tes traces,
              révéler tes sommets et faire grandir ton histoire HOVREN.
            </p>

            <div className={styles.heroActions}>
              <button
                type="button"
                onClick={connectStrava}
                disabled={isConnecting || isLoadingStatus}
                className={styles.primaryButton}
              >
                {isConnecting ? (
                  <Loader2 className={styles.spin} aria-hidden="true" />
                ) : (
                  <ArrowRight aria-hidden="true" />
                )}
                {status.connected || status.requiresReconnect
                  ? "Reconnecter Strava"
                  : "Connecter Strava"}
              </button>

              {status.connected ? (
                <button
                  type="button"
                  onClick={syncStrava}
                  disabled={isSyncing}
                  className={styles.secondaryButton}
                >
                  <RefreshCw
                    className={isSyncing ? styles.spin : undefined}
                    aria-hidden="true"
                  />
                  Synchroniser
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.heroStatus}>
            <span className={styles.heroStatusLabel}>État de la connexion</span>
            <div
              className={`${styles.connectionBadge} ${
                status.connected
                  ? styles.connectionBadgeConnected
                  : status.requiresReconnect
                    ? styles.connectionBadgeWarning
                    : styles.connectionBadgeNeutral
              }`}
            >
              <span />
              {isLoadingStatus
                ? "Vérification…"
                : status.connected
                  ? "Compte connecté"
                  : status.requiresReconnect
                    ? "Connexion à renouveler"
                    : "Aucun compte connecté"}
            </div>
            <p>
              {status.connected
                ? "Tes nouvelles sorties peuvent rejoindre HOVREN à tout moment."
                : status.requiresReconnect
                  ? "Ton historique reste conservé pendant le renouvellement."
                  : "Une autorisation OAuth suffit pour commencer l’import."}
            </p>
            <div className={styles.heroMark} aria-hidden="true">
              <svg viewBox="0 0 240 96" fill="none">
                <path d="M4 78C38 66 48 34 83 41c29 6 33 34 64 24 28-9 38-47 89-55" />
                <circle cx="147" cy="65" r="4" />
                <circle cx="236" cy="10" r="4" />
              </svg>
            </div>
          </div>
        </section>

        {message ? (
          <div
            className={`${styles.feedback} ${
              message.variant === "success"
                ? styles.feedbackSuccess
                : message.variant === "warning"
                  ? styles.feedbackWarning
                  : message.variant === "error"
                    ? styles.feedbackError
                    : styles.feedbackNeutral
            }`}
            role={message.variant === "error" ? "alert" : "status"}
          >
            {message.variant === "success" ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <CircleAlert aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        ) : null}

        <div className={styles.overviewGrid}>
          <section className={styles.activityCard}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>Dernier import</span>
                <h2>Dernière sortie synchronisée</h2>
              </div>
              {lastSyncedActivity?.sport ? (
                <span className={styles.sportBadge}>
                  {lastSyncedActivity.sport}
                </span>
              ) : null}
            </div>

            {lastSyncedActivity ? (
              <div className={styles.activityContent}>
                <div className={styles.activityVisual} aria-hidden="true">
                  <span className={styles.activityVisualIcon}>
                    <Activity />
                  </span>
                  <svg viewBox="0 0 360 176" fill="none">
                    <path
                      className={styles.topographicLine}
                      d="M-8 132c48-57 92-66 132-28 35 33 64 38 98 8 40-35 79-31 146 10"
                    />
                    <path
                      className={styles.routeLine}
                      d="M15 143c30-17 50-43 82-38 27 4 34 25 62 22 35-4 41-56 80-60 34-4 43 28 96 7"
                    />
                    <circle cx="15" cy="143" r="5" />
                    <circle cx="335" cy="74" r="6" />
                  </svg>
                </div>

                <div className={styles.activityDetails}>
                  <span className={styles.activityDate}>
                    {formatActivityDate(lastSyncedActivity.startedAt) ||
                      "Date non renseignée"}
                  </span>
                  <h3>{getActivityTitle(lastSyncedActivity)}</h3>
                  <p>
                    Une nouvelle trace ajoutée à ton carnet et prête à nourrir
                    tes statistiques, sommets et souvenirs.
                  </p>

                  <dl className={styles.activityMetrics}>
                    <div>
                      <dt>Distance</dt>
                      <dd>
                        {formatDistance(lastSyncedActivity.distance) || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>Temps</dt>
                      <dd>
                        {formatDuration(lastSyncedActivity.duration) || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>Dénivelé</dt>
                      <dd>
                        {formatElevation(lastSyncedActivity.elevationGain) ||
                          "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className={styles.activityEmpty}>
                <span>
                  <Activity aria-hidden="true" />
                </span>
                <div>
                  <h3>Aucune trace synchronisée</h3>
                  <p>
                    {syncResult
                      ? "La synchronisation est terminée, sans nouvelle activité à afficher."
                      : "Synchronise Strava pour faire apparaître ici ta dernière sortie."}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={styles.statusCard}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>Connexion</span>
                <h2>Statut de synchronisation</h2>
              </div>
              <span
                className={`${styles.statusIcon} ${
                  status.connected
                    ? styles.statusIconConnected
                    : status.requiresReconnect
                      ? styles.statusIconWarning
                      : styles.statusIconNeutral
                }`}
              >
                {status.connected ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Link2 aria-hidden="true" />
                )}
              </span>
            </div>

            <div className={styles.statusBody}>
              <span
                className={`${styles.statusPill} ${
                  status.connected
                    ? styles.statusPillConnected
                    : status.requiresReconnect
                      ? styles.statusPillWarning
                      : styles.statusPillNeutral
                }`}
              >
                {status.connected
                  ? "Connecté"
                  : status.requiresReconnect
                    ? "À reconnecter"
                    : "Non connecté"}
              </span>

              <h3>
                {isLoadingStatus
                  ? "Vérification en cours…"
                  : status.connected
                    ? "Compte Strava connecté"
                    : status.requiresReconnect
                      ? "Connexion Strava à renouveler"
                      : "Aucun compte connecté"}
              </h3>
              <p>
                {status.connected
                  ? `Athlète Strava ${status.athleteId || "identifié"}`
                  : status.requiresReconnect
                    ? "Reconnecte Strava pour reprendre les synchronisations. Ton historique HOVREN est conservé."
                    : "Connecte Strava pour importer tes traces dans ton carnet."}
              </p>

              {status.lastUpdatedAt ? (
                <div className={styles.statusMeta}>
                  <RefreshCw aria-hidden="true" />
                  Dernière mise à jour le{" "}
                  {formatActivityDate(status.lastUpdatedAt)}
                </div>
              ) : null}
            </div>

            {status.connected ? (
              <button
                type="button"
                onClick={disconnectStrava}
                disabled={isDisconnecting}
                className={styles.disconnectButton}
              >
                {isDisconnecting ? (
                  <Loader2 className={styles.spin} aria-hidden="true" />
                ) : (
                  <Unlink aria-hidden="true" />
                )}
                Déconnecter
              </button>
            ) : null}
          </section>
        </div>

        <section className={styles.dataSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionEyebrow}>Ce qui rejoint HOVREN</span>
            <h2>Les données utiles, sans ressaisie</h2>
            <p>
              Chaque import enrichit ton carnet avec les repères essentiels de
              ta sortie.
            </p>
          </div>

          <div className={styles.dataGrid}>
            {importedData.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className={styles.dataItem}>
                  <span className={styles.dataIcon}>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.workflowSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionEyebrow}>En quatre étapes</span>
            <h2>De Strava à ton carnet</h2>
            <p>
              Une connexion simple, sécurisée et toujours sous ton contrôle.
            </p>
          </div>

          <ol className={styles.workflowList}>
            {workflowSteps.map((step, index) => (
              <li key={step}>
                <span>0{index + 1}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </DashboardLayout>
  );
}
