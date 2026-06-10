"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ElementType } from "react";

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Flame,
  Gauge,
  HeartPulse,
  MapPin,
  Mountain,
  Route,
  Timer,
  Trophy,
} from "lucide-react";

import { MiniRouteMap } from "@/components/activities/mini-route-map";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivity } from "@/hooks/use-activities";
import type { Activity as ActivityModel } from "@/lib/activities";

const sportLabels: Record<string, string> = {
  RUNNING: "Course",
  ROAD_CYCLING: "Cyclisme",
  GRAVEL: "Gravel",
  MTB: "VTT",
  TRAIL: "Trail",
  HIKING: "Randonnée",
  WALKING: "Marche",
  GYM: "Musculation",
  FITNESS: "Fitness",
  SWIMMING: "Natation",
  SKI: "Ski",
  SNOWBOARD: "Snowboard",
  CLIMBING: "Escalade",
};

function formatNumber(
  value: number | null,
  options?: Intl.NumberFormatOptions,
) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR", options).format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)}H${String(minutes % 60).padStart(
    2,
    "0",
  )}`;
}

function formatMovingTime(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }

  const minutes = Math.round(seconds / 60);

  return formatDuration(minutes);
}

function formatDate(date: string) {
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function formatSpeed(speedMetersPerSecond: number | null) {
  if (speedMetersPerSecond === null) {
    return "—";
  }

  return formatNumber(speedMetersPerSecond * 3.6, {
    maximumFractionDigits: 1,
  });
}

function formatPace(activity: ActivityModel) {
  if (!activity.distance || activity.duration <= 0) {
    return "—";
  }

  const pace = activity.duration / activity.distance;
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);

  return `${minutes}'${String(seconds).padStart(2, "0")}`;
}

function decodeFirstPolylinePoint(polyline: string | null) {
  if (!polyline) {
    return null;
  }

  const encodedPolyline = polyline;
  let index = 0;
  let lat = 0;
  let lng = 0;

  function decodeValue() {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encodedPolyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encodedPolyline.length);

    return result & 1 ? ~(result >> 1) : result >> 1;
  }

  if (encodedPolyline.length < 2) {
    return null;
  }

  lat += decodeValue();
  lng += decodeValue();

  return {
    lat: lat / 1e5,
    lng: lng / 1e5,
  };
}

function formatCoordinates(latitude: number, longitude: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
  }).format(latitude)}, ${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
  }).format(longitude)}`;
}

function formatStartLocation(activity: ActivityModel) {
  const namedLocation = [activity.city, activity.country]
    .filter(Boolean)
    .join(", ");

  if (namedLocation) {
    return namedLocation;
  }

  if (activity.startLatitude !== null && activity.startLongitude !== null) {
    return `Départ ${formatCoordinates(
      activity.startLatitude,
      activity.startLongitude,
    )}`;
  }

  const firstRoutePoint = decodeFirstPolylinePoint(activity.routePolyline);

  if (firstRoutePoint) {
    return `Départ ${formatCoordinates(firstRoutePoint.lat, firstRoutePoint.lng)}`;
  }

  return "Départ non localisé";
}

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon: ElementType;
  tone: string;
};

function MetricCard({ label, value, unit, icon: Icon, tone }: MetricCardProps) {
  return (
    <div className="app-activity-detail-metric rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Icon className={`h-4 w-4 ${tone}`} />
        {label}
      </div>

      <div className="mt-3 flex items-end gap-1">
        <p className="text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>

        {unit && <span className="pb-1 text-sm text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}

export default function ActivityDetailsPage() {
  const params = useParams<{ id: string }>();
  const activityId = params.id;
  const { data: activity, isLoading, error } = useActivity(activityId);

  const sportLabel = activity
    ? sportLabels[activity.sport] || activity.sport
    : "Activité";
  const startLocation = activity ? formatStartLocation(activity) : "";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Link
          href="/activites"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux activités
        </Link>

        {isLoading && (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-10 text-center text-zinc-400">
            Chargement du détail...
          </div>
        )}

        {error && (
          <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-10 text-center text-red-300">
            Impossible de charger cette activité.
          </div>
        )}

        {activity && (
          <FadeIn>
            <section className="app-activity-detail-hero relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#171922]/95 p-5 backdrop-blur-xl lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_34%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_34%)]" />
              <div className="absolute top-10 left-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute right-16 bottom-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative grid gap-7 xl:grid-cols-[minmax(0,0.86fr)_minmax(460px,0.78fr)] xl:items-stretch">
                <div className="flex min-w-0 flex-col justify-between gap-8">
                  <div>
                    <div className="app-activity-detail-badge inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200">
                      <Activity className="h-3.5 w-3.5" />
                      {sportLabel}
                    </div>

                    <h1 className="app-activity-detail-title mt-5 max-w-3xl text-3xl leading-[1.08] font-bold tracking-tight text-white lg:text-4xl xl:text-5xl">
                      {activity.title || "Activité sans titre"}
                    </h1>

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <CalendarDays className="h-4 w-4 text-violet-300" />
                        {formatDate(activity.startedAt)}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <MapPin className="h-4 w-4 text-sky-300" />
                        {startLocation}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 xl:max-w-[620px]">
                    <MetricCard
                      label="Distance"
                      value={formatNumber(activity.distance, {
                        maximumFractionDigits: 2,
                      })}
                      unit="km"
                      icon={Route}
                      tone="text-sky-300"
                    />
                    <MetricCard
                      label="Durée"
                      value={formatDuration(activity.duration)}
                      icon={Timer}
                      tone="text-violet-300"
                    />
                    <MetricCard
                      label="Dénivelé"
                      value={formatNumber(activity.elevationGain, {
                        maximumFractionDigits: 0,
                      })}
                      unit="m"
                      icon={Mountain}
                      tone="text-emerald-300"
                    />
                    <MetricCard
                      label="Calories"
                      value={formatNumber(activity.calories, {
                        maximumFractionDigits: 0,
                      })}
                      icon={Flame}
                      tone="text-orange-300"
                    />
                  </div>
                </div>

                <div className="app-activity-detail-map flex w-full items-center justify-end">
                  <MiniRouteMap
                    display="square"
                    polyline={activity.routePolyline}
                    size="large"
                  />
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-[28px] border border-white/[0.08] bg-[#171922]/92 p-5 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Analyse</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                      Performance de la sortie
                    </h2>
                  </div>

                  <div className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-zinc-300 sm:block">
                    {sportLabel}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard
                    label="Allure"
                    value={formatPace(activity)}
                    unit="/km"
                    icon={Clock3}
                    tone="text-lime-300"
                  />
                  <MetricCard
                    label="Vitesse moyenne"
                    value={formatSpeed(activity.averageSpeed)}
                    unit="km/h"
                    icon={Gauge}
                    tone="text-sky-300"
                  />
                  <MetricCard
                    label="Vitesse max"
                    value={formatSpeed(activity.maxSpeed)}
                    unit="km/h"
                    icon={Trophy}
                    tone="text-amber-300"
                  />
                  <MetricCard
                    label="Temps mouvement"
                    value={formatMovingTime(activity.movingTime)}
                    icon={Timer}
                    tone="text-violet-300"
                  />
                  <MetricCard
                    label="FC moyenne"
                    value={formatNumber(activity.averageHeartRate, {
                      maximumFractionDigits: 0,
                    })}
                    unit="bpm"
                    icon={HeartPulse}
                    tone="text-rose-300"
                  />
                  <MetricCard
                    label="FC max"
                    value={formatNumber(activity.maxHeartRate, {
                      maximumFractionDigits: 0,
                    })}
                    unit="bpm"
                    icon={HeartPulse}
                    tone="text-red-300"
                  />
                </div>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-white/[0.08] bg-[#171922]/92 p-5 backdrop-blur-xl">
                  <p className="text-sm text-zinc-500">Résumé</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                    Les repères clés
                  </h2>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-sm">
                      <span className="text-zinc-500">Type</span>
                      <span className="font-medium text-white">
                        {sportLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-sm">
                      <span className="text-zinc-500">Statut</span>
                      <span className="font-medium text-emerald-300">
                        Terminée
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-sm">
                      <span className="text-zinc-500">Tracé</span>
                      <span className="font-medium text-white">
                        {activity.routePolyline ? "Disponible" : "Absent"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Source</span>
                      <span className="font-medium text-white">
                        {activity.routePolyline ? "Strava" : "Sport Tracker"}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/[0.08] bg-[#171922]/92 p-5 backdrop-blur-xl">
                  <p className="text-sm text-zinc-500">Notes</p>
                  <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-sm leading-6 text-zinc-300">
                    {activity.description?.trim() ||
                      "Aucune note ajoutée pour cette activité."}
                  </div>
                </section>
              </aside>
            </div>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
