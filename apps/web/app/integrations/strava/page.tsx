"use client";

import { useEffect, useMemo, useState } from "react";

import type { AxiosError } from "axios";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
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

interface StravaStatus {
  connected: boolean;
  athleteId?: string;
  expiresAt?: string;
  lastUpdatedAt?: string;
}

interface SyncResult {
  imported: number;
  fetched: number;
}

type FeedbackVariant = "success" | "warning" | "error" | "neutral";

interface FeedbackMessage {
  text: string;
  variant: FeedbackVariant;
}

const importedData = [
  {
    icon: Activity,
    title: "Activités",
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
  "Import des activités",
];

const callbackFailureMessages: Record<string, string> = {
  state_invalid:
    "Le retour Strava n'est plus valide. Relancez la connexion depuis Sport Tracker.",
  token_exchange_failed:
    "Strava a refusé l'échange OAuth. Vérifiez surtout le Client Secret et le domaine de rappel.",
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

export default function StravaIntegrationPage() {
  const [status, setStatus] = useState<StravaStatus>({
    connected: false,
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [isConnecting, setIsConnecting] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

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
  }, []);

  useEffect(() => {
    if (callbackMessage) {
      setMessage(callbackMessage);
    }
  }, [callbackMessage]);

  async function refreshStatus() {
    try {
      setIsLoadingStatus(true);

      const { data } = await api.get<StravaStatus>("/strava/status");

      setStatus(data);
    } catch (error) {
      console.error(error);

      if (getErrorStatus(error) === 401) {
        setMessage({
          text: "Votre session a expiré. Reconnectez-vous, puis relancez la connexion Strava.",
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
          text: "Votre session a expiré. Reconnectez-vous avant de connecter Strava.",
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
        text: `${data.fetched} activité${data.fetched > 1 ? "s" : ""} récupérée${data.fetched > 1 ? "s" : ""}.`,
        variant: "success",
      });

      await refreshStatus();
    } catch (error) {
      console.error(error);

      if (getErrorStatus(error) === 401) {
        setMessage({
          text: "Votre session a expiré. Reconnectez-vous avant de synchroniser Strava.",
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
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-[#11131A]/80 p-8 backdrop-blur-xl">
          <div className="absolute top-0 -right-24 h-72 w-72 rounded-full bg-[#FC4C02]/15 blur-[120px]" />
          <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(252,76,2,0.12),transparent_35%)]" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">
                <Link2 className="h-4 w-4 text-orange-300" />

                <span className="text-xs font-semibold tracking-wider text-orange-300 uppercase">
                  Intégration officielle
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white">
                Connectez votre compte Strava
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
                Importez automatiquement vos activités, vos performances et
                votre historique sportif dans Sport Tracker.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={connectStrava}
                disabled={isConnecting || isLoadingStatus}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FC4C02] px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(252,76,2,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {status.connected ? "Reconnecter Strava" : "Connecter Strava"}
              </button>

              {status.connected && (
                <button
                  type="button"
                  onClick={syncStrava}
                  disabled={isSyncing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  Synchroniser
                </button>
              )}
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium ${
              message.variant === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : message.variant === "warning"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : message.variant === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-200"
                    : "border-white/[0.08] bg-white/[0.04] text-zinc-300"
            }`}
          >
            {message.variant === "success" && (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {importedData.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
                  <Icon className="h-5 w-5 text-orange-300" />
                </div>

                <h3 className="font-semibold text-white">{item.title}</h3>

                <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[32px] border border-white/[0.06] bg-[#11131A]/70 p-8">
          <h2 className="text-xl font-semibold text-white">
            Comment fonctionne la synchronisation ?
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-5"
              >
                <div className="mb-3 text-2xl font-bold text-orange-300">
                  0{index + 1}
                </div>

                <p className="text-sm font-medium text-white">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/[0.06] bg-[#11131A]/70 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Statut de synchronisation
              </h2>

              {syncResult && (
                <p className="mt-2 text-sm text-zinc-400">
                  Dernier import : {syncResult.imported} nouvelle(s)
                  activité(s).
                </p>
              )}
            </div>

            {status.connected && (
              <button
                type="button"
                onClick={disconnectStrava}
                disabled={isDisconnecting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Déconnecter
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">
                {isLoadingStatus
                  ? "Vérification..."
                  : status.connected
                    ? "Compte Strava connecté"
                    : "Aucun compte connecté"}
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                {status.connected
                  ? `Athlète Strava ${status.athleteId}`
                  : "Connectez Strava pour importer vos activités."}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs ${
                status.connected
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {status.connected && <CheckCircle2 className="h-3.5 w-3.5" />}
              {status.connected ? "Connecté" : "Non connecté"}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
