"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { ElementType } from "react";

import {
  ArrowLeft,
  CalendarDays,
  Ellipsis,
  Flame,
  MapPin,
  Mountain,
  Route,
  Share2,
  SunMedium,
  Timer,
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

const heroFallbackImage =
  "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1600";

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

  return `${Math.floor(minutes / 60)}H${String(minutes % 60).padStart(2, "0")}`;
}

function formatMovingTime(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }

  return formatDuration(Math.round(seconds / 60));
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

function decodePolyline(polyline: string | null) {
  if (!polyline) {
    return [];
  }

  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

function formatCoordinates(latitude: number, longitude: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
  }).format(latitude)}, ${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
  }).format(longitude)}`;
}

function getSportLabel(activity: ActivityModel | null) {
  if (!activity) {
    return "Activité";
  }

  return sportLabels[activity.sport] || activity.sport;
}

function getStartLabel(activity: ActivityModel) {
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

  const points = decodePolyline(activity.routePolyline);
  const firstPoint = points[0];

  if (firstPoint) {
    return `Départ ${formatCoordinates(firstPoint.lat, firstPoint.lng)}`;
  }

  return "Départ non localisé";
}

function getDifficultyLabel(activity: ActivityModel) {
  const score =
    (activity.elevationGain ?? 0) * 0.58 +
    (activity.distance ?? 0) * 18 +
    activity.duration * 4;

  if (score >= 1800) {
    return "Soutenue";
  }

  if (score >= 1200) {
    return "Engagée";
  }

  if (score >= 760) {
    return "Régulière";
  }

  return "Accessible";
}

function getHeroText(activity: ActivityModel) {
  if ((activity.maxAltitude ?? 0) >= 2200) {
    return "Une vraie journée d'altitude, avec une sortie qui prend de la hauteur et laisse une trace marquée.";
  }

  if ((activity.elevationGain ?? 0) >= 1000) {
    return "Un profil montagne bien dessiné, du dénivelé, et une lecture de terrain qui donne envie d'y retourner.";
  }

  return "Une sortie lisible, propre, avec tous les repères utiles pour revivre le moment d'un coup d'oeil.";
}

function getSummaryText(activity: ActivityModel) {
  if (activity.description?.trim()) {
    return activity.description.trim();
  }

  return "Ajoute un souvenir, ton ressenti ou les conditions rencontrées pendant cette sortie.";
}

function getSurfaceLabel(activity: ActivityModel) {
  if (activity.sport === "TRAIL" || activity.sport === "HIKING") {
    return "Sentier, roche";
  }

  if (activity.sport === "MTB" || activity.sport === "GRAVEL") {
    return "Piste, chemin";
  }

  if (activity.sport === "ROAD_CYCLING" || activity.sport === "RUNNING") {
    return "Route, sentier";
  }

  return "Terrain mixte";
}

function getSourceLabel(activity: ActivityModel) {
  return activity.stravaActivityId ? "Strava" : "Montaro";
}

function getLoopTag(activity: ActivityModel) {
  const points = decodePolyline(activity.routePolyline);
  const first = points[0];
  const last = points.at(-1);

  if (!first || !last) {
    return null;
  }

  const dx = first.lat - last.lat;
  const dy = first.lng - last.lng;
  const approxDistanceMeters = Math.sqrt(dx * dx + dy * dy) * 111_000;

  return approxDistanceMeters < 250 ? "Boucle" : "Aller-retour";
}

function getTerrainTags(activity: ActivityModel) {
  const tags: string[] = [];

  if (activity.sport === "TRAIL") {
    tags.push("Trail");
  }

  if ((activity.maxAltitude ?? 0) >= 1800) {
    tags.push("Montagne");
  }

  const loopTag = getLoopTag(activity);

  if (loopTag) {
    tags.push(loopTag);
  }

  if (activity.country) {
    tags.push(activity.country);
  }

  return tags.slice(0, 4);
}

function getLowAltitude(activity: ActivityModel) {
  if (
    activity.maxAltitude !== null &&
    activity.elevationGain !== null &&
    activity.maxAltitude > activity.elevationGain
  ) {
    return activity.maxAltitude - activity.elevationGain;
  }

  return null;
}

type StatProps = {
  icon: ElementType;
  label: string;
  value: string;
  unit?: string;
};

function Stat({ icon: Icon, label, value, unit }: StatProps) {
  return (
    <div className="flex min-h-[92px] items-center gap-4 px-5 py-4 sm:px-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl leading-none font-bold tracking-tight text-slate-900 xl:text-3xl">
          {value}
          {unit && (
            <span className="ml-1 text-base font-semibold text-slate-700">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ActivityDetailsPage() {
  const params = useParams<{ id: string }>();
  const activityId = params.id;
  const { data: activity, isLoading, error } = useActivity(activityId);
  const [heroPanel, setHeroPanel] = useState<"map" | "photos">("map");

  const coverImageUrl = activity?.coverImageUrl || heroFallbackImage;
  const sportLabel = getSportLabel(activity ?? null);
  const difficulty = activity ? getDifficultyLabel(activity) : "—";
  const startLabel = activity ? getStartLabel(activity) : "";
  const hasPhoto = Boolean(activity?.coverImageUrl);

  return (
    <DashboardLayout>
      <div className="app-activity-detail-page mx-auto w-full max-w-[1480px] space-y-5 px-4 py-6 sm:px-6 xl:px-8">
        <Link
          href="/activites"
          className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sorties
        </Link>

        {isLoading && (
          <section className="rounded-[24px] border border-emerald-100 bg-white/90 p-10 text-center text-slate-500 shadow-[0_18px_48px_rgba(6,78,59,0.08)]">
            Chargement de la sortie...
          </section>
        )}

        {error && (
          <section className="rounded-[24px] border border-red-200 bg-red-50/90 p-10 text-center text-red-700 shadow-[0_18px_48px_rgba(153,27,27,0.06)]">
            Impossible de charger cette sortie.
          </section>
        )}

        {activity && (
          <FadeIn>
            <div className="space-y-5">
              <section className="grid overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] lg:h-[400px] lg:grid-cols-[1.12fr_0.88fr] xl:h-[420px]">
                <div className="relative h-[300px] overflow-hidden lg:h-auto">
                  <Image
                    src={coverImageUrl}
                    alt={activity.title || "Photo de sortie"}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 56vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(3,18,14,0.88)_0%,rgba(3,18,14,0.48)_46%,rgba(3,18,14,0.16)_100%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,15,18,0.38),rgba(7,15,18,0.14)_42%,transparent)]" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-5 lg:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[#1f3c2e]/70 px-4 py-2 text-sm font-semibold text-emerald-50 backdrop-blur-sm">
                        <Mountain className="h-4 w-4" />
                        {sportLabel}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/20 text-white/90 backdrop-blur-sm"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/20 text-white/90 backdrop-blur-sm"
                        >
                          <Ellipsis className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-w-[760px]">
                      <h1 className="max-w-[760px] text-[clamp(2.25rem,3vw,3.4rem)] leading-[1.02] font-bold tracking-[-0.035em] text-white">
                        {activity.title || "Sortie sans titre"}
                      </h1>
                      <p className="mt-4 max-w-[46ch] text-[15px] leading-6 font-medium text-white/84 lg:text-base lg:leading-7">
                        {getHeroText(activity)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                        <CalendarDays className="h-4 w-4 text-emerald-100" />
                        {formatDate(activity.startedAt)}
                      </span>
                      <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                        <MapPin className="h-4 w-4 text-emerald-100" />
                        {startLabel}
                      </span>
                      <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                        <SunMedium className="h-4 w-4 text-amber-300" />
                        {difficulty}
                      </span>
                      {activity.temperature !== null && (
                        <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/12 bg-black/24 px-4 text-sm font-semibold text-white/92 backdrop-blur-sm">
                          <SunMedium className="h-4 w-4 text-amber-300" />
                          {formatNumber(activity.temperature, {
                            maximumFractionDigits: 0,
                          })}
                          °C
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex h-[300px] flex-col gap-3 bg-white p-3 lg:h-auto lg:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 p-1">
                      <button
                        type="button"
                        onClick={() => setHeroPanel("map")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          heroPanel === "map"
                            ? "bg-white text-emerald-900 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                            : "text-slate-500"
                        }`}
                      >
                        Carte
                      </button>
                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={() => setHeroPanel("photos")}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            heroPanel === "photos"
                              ? "bg-white text-emerald-900 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                              : "text-slate-500"
                          }`}
                        >
                          Photos
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    id="activity-map"
                    className="flex-1 overflow-hidden rounded-[22px] border border-emerald-100 bg-emerald-50/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                  >
                    {heroPanel === "map" ? (
                      <MiniRouteMap
                        display="wide"
                        polyline={activity.routePolyline}
                        size="large"
                      />
                    ) : (
                      <div className="relative h-full min-h-[260px] overflow-hidden bg-[#eaf7df]">
                        <Image
                          src={coverImageUrl}
                          alt={activity.title || "Photo de sortie"}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 44vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(7,15,18,0.46),rgba(7,15,18,0.04)_56%)]" />
                        <div className="absolute bottom-4 left-4 rounded-full border border-white/18 bg-black/24 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                          Photo principale
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  icon={Route}
                  label="Distance"
                  value={formatNumber(activity.distance, {
                    maximumFractionDigits: 2,
                  })}
                  unit="km"
                />
                <div className="border-t border-emerald-100 sm:border-t-0 sm:border-l">
                  <Stat
                    icon={Timer}
                    label="Temps en mouvement"
                    value={formatMovingTime(activity.movingTime)}
                  />
                </div>
                <div className="border-t border-emerald-100 xl:border-t-0 xl:border-l">
                  <Stat
                    icon={Mountain}
                    label="Dénivelé +"
                    value={formatNumber(activity.elevationGain, {
                      maximumFractionDigits: 0,
                    })}
                    unit="m"
                  />
                </div>
                <div className="border-t border-emerald-100 sm:border-l xl:border-t-0">
                  <Stat
                    icon={Flame}
                    label="Calories"
                    value={formatNumber(activity.calories, {
                      maximumFractionDigits: 0,
                    })}
                    unit="kcal"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
                <section className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)]">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Profil de la sortie
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Altitude et dénivelé sur l’ensemble du parcours
                    </p>
                  </div>

                  <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-[18px] border border-emerald-100 bg-emerald-50/60 p-6 text-center">
                    <div className="max-w-md">
                      <Mountain className="mx-auto h-7 w-7 text-emerald-700" />
                      <p className="mt-3 text-sm font-medium text-slate-600">
                        Le profil d’altitude n’est pas disponible pour cette
                        activité.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[18px] border border-emerald-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Altitude min
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {getLowAltitude(activity) !== null
                          ? `${formatNumber(getLowAltitude(activity), {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-emerald-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Altitude max
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {activity.maxAltitude !== null
                          ? `${formatNumber(activity.maxAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-emerald-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Dénivelé positif
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {activity.elevationGain !== null
                          ? `${formatNumber(activity.elevationGain, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-emerald-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Dénivelé négatif
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">—</p>
                    </div>
                  </div>
                </section>

                <aside className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)]">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Résumé de la sortie
                  </h2>

                  <div className="mt-5 grid gap-3">
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">Type</span>
                      <strong className="text-right font-semibold text-slate-900">
                        {sportLabel}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Difficulté
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {difficulty}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">Source</span>
                      <strong className="text-right font-semibold text-slate-900">
                        {getSourceLabel(activity)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Allure moyenne
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {formatPace(activity)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Vitesse moyenne
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {formatSpeed(activity.averageSpeed)} km/h
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Fréquence cardiaque
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {activity.averageHeartRate !== null
                          ? `${formatNumber(activity.averageHeartRate, {
                              maximumFractionDigits: 0,
                            })} bpm`
                          : "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Altitude minimale
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {getLowAltitude(activity) !== null
                          ? `${formatNumber(getLowAltitude(activity), {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Altitude maximale
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {activity.maxAltitude !== null
                          ? `${formatNumber(activity.maxAltitude, {
                              maximumFractionDigits: 0,
                            })} m`
                          : "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-500">
                        Terrain
                      </span>
                      <strong className="text-right font-semibold text-slate-900">
                        {getSurfaceLabel(activity)}
                      </strong>
                    </div>
                  </div>

                  {getTerrainTags(activity).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {getTerrainTags(activity).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </aside>
              </div>

              <div
                className={`grid gap-5 ${hasPhoto ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}
              >
                <section className="rounded-[22px] border border-emerald-100 bg-white p-5 shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)]">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Conditions
                  </h2>

                  {activity.temperature !== null || activity.weather ? (
                    <>
                      <div className="mt-4">
                        <strong className="text-[2rem] leading-none font-bold tracking-tight text-slate-900">
                          {activity.temperature !== null
                            ? `${formatNumber(activity.temperature, {
                                maximumFractionDigits: 0,
                              })}°C`
                            : activity.weather}
                        </strong>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          {activity.weather || "Conditions au depart"}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-3 text-sm">
                          <span className="font-medium text-slate-500">
                            Temperature
                          </span>
                          <strong className="font-semibold text-slate-900">
                            {activity.temperature !== null
                              ? `${formatNumber(activity.temperature, {
                                  maximumFractionDigits: 0,
                                })}°C`
                              : "—"}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-3 text-sm">
                          <span className="font-medium text-slate-500">
                            Vent
                          </span>
                          <strong className="font-semibold text-slate-900">
                            —
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-500">
                            Humidite
                          </span>
                          <strong className="font-semibold text-slate-900">
                            —
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 font-medium text-slate-600">
                      Météo indisponible pour cette sortie.
                    </div>
                  )}
                </section>

                <section className="rounded-[22px] border border-emerald-100 bg-white p-5 shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)]">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Journal de sortie
                  </h2>

                  <p className="mt-4 text-[15px] leading-7 font-medium text-slate-600">
                    {getSummaryText(activity)}
                  </p>

                  <button
                    type="button"
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[16px] border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
                  >
                    Ajouter une note
                  </button>
                </section>

                {hasPhoto && (
                  <section className="rounded-[22px] border border-emerald-100 bg-white p-5 shadow-[0_18px_48px_rgba(6,78,59,0.08),inset_0_1px_0_rgba(255,255,255,0.86)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                          Photos
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Photo principale liée à l’activité
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        1 photo
                      </span>
                    </div>

                    <div className="mt-4 flex gap-3 overflow-x-auto">
                      <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-[18px] border border-emerald-100">
                        <Image
                          src={coverImageUrl}
                          alt={activity.title || "Photo de sortie"}
                          fill
                          unoptimized
                          sizes="176px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[16px] border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
                    >
                      Voir toutes les photos
                    </button>
                  </section>
                )}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
