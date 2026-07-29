import type { Activity } from "@/lib/activities";

export type ActivityPhoto = {
  src: string;
  alt: string;
};

export type ElevationPoint = {
  distance: number;
  elevation: number;
};

export type ElevationData = {
  points: ElevationPoint[];
  minimum: number;
  maximum: number;
  ascent: number;
  descent: number | null;
  source: "strava" | "reconstructed";
};

export type FormattedActivityDate = {
  full: string;
  time: string;
};

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

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat("fr-FR", options).format(value);
}

export function formatDuration(minutes: number) {
  const roundedMinutes = Math.max(0, Math.round(minutes));

  if (roundedMinutes < 60) {
    return `${roundedMinutes} min`;
  }

  return `${Math.floor(roundedMinutes / 60)} h ${String(
    roundedMinutes % 60,
  ).padStart(2, "0")}`;
}

export function formatActivityDate(date: string): FormattedActivityDate {
  const value = new Date(date);

  return {
    full: new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(value),
    time: new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(value),
  };
}

export function getSportLabel(activity: Activity) {
  return sportLabels[activity.sport] ?? activity.sport;
}

export function getLocationLabel(activity: Activity) {
  const namedLocation = [activity.city, activity.country]
    .filter(Boolean)
    .join(", ");

  return namedLocation || "Lieu non renseigné";
}

export function getDifficultyLabel(activity: Activity) {
  const score =
    (activity.elevationGain ?? 0) * 0.58 +
    (activity.distance ?? 0) * 18 +
    activity.duration * 4;

  if (score >= 1800) return "Soutenue";
  if (score >= 1200) return "Engagée";
  if (score >= 760) return "Régulière";
  return "Accessible";
}

export function getSurfaceLabel(activity: Activity) {
  if (activity.sport === "TRAIL" || activity.sport === "HIKING") {
    return "Sentier et roche";
  }

  if (activity.sport === "MTB" || activity.sport === "GRAVEL") {
    return "Piste et chemin";
  }

  if (activity.sport === "ROAD_CYCLING" || activity.sport === "RUNNING") {
    return "Route et sentier";
  }

  return "Terrain mixte";
}

export function getPace(activity: Activity) {
  const durationMinutes =
    activity.movingTime !== null
      ? activity.movingTime / 60
      : activity.duration;

  if (
    !activity.distance ||
    activity.distance <= 0 ||
    durationMinutes <= 0
  ) {
    return null;
  }

  const paceInSeconds = Math.round(
    (durationMinutes * 60) / activity.distance,
  );
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = paceInSeconds % 60;

  return `${minutes}'${String(seconds).padStart(2, "0")}" /km`;
}

export function getLoopLabel(polyline: string | null) {
  const points = decodePolyline(polyline);
  const first = points[0];
  const last = points.at(-1);

  if (!first || !last) return null;

  const latitudeDelta = first.lat - last.lat;
  const longitudeDelta = first.lng - last.lng;
  const distance =
    Math.sqrt(
      latitudeDelta * latitudeDelta + longitudeDelta * longitudeDelta,
    ) * 111_000;

  return distance < 250 ? "Boucle" : "Linéaire";
}

function isLoopActivity(activity: Activity) {
  const routePoints = decodePolyline(activity.routePolyline);
  const routeStart = routePoints[0];
  const routeEnd = routePoints.at(-1);

  if (routeStart && routeEnd) {
    return getDistanceBetweenPoints(routeStart, routeEnd) < 250;
  }

  if (
    typeof activity.startLatitude === "number" &&
    typeof activity.startLongitude === "number" &&
    typeof activity.endLatitude === "number" &&
    typeof activity.endLongitude === "number"
  ) {
    return (
      getDistanceBetweenPoints(
        {
          lat: activity.startLatitude,
          lng: activity.startLongitude,
        },
        {
          lat: activity.endLatitude,
          lng: activity.endLongitude,
        },
      ) < 250
    );
  }

  return null;
}

export function getActivityPhotos(activity: Activity): ActivityPhoto[] {
  const candidates = [
    activity.coverImageUrl,
    ...(activity.photoUrls ?? []),
  ];
  const seen = new Set<string>();

  return candidates.flatMap((candidate, index) => {
    if (!candidate || seen.has(candidate)) return [];

    try {
      const url = new URL(candidate);

      if (url.protocol !== "https:" && url.protocol !== "http:") return [];

      seen.add(candidate);
      return [
        {
          src: url.toString(),
          alt:
            index === 0
              ? `Vue principale de ${activity.title ?? "la sortie"}`
              : `Photo ${index + 1} de ${activity.title ?? "la sortie"}`,
        },
      ];
    } catch {
      return [];
    }
  });
}

export function getElevationData(activity: Activity): ElevationData | null {
  const elevations = activity.altitudeStream ?? [];

  if (
    elevations.length >= 2 &&
    elevations.every((value) => Number.isFinite(value))
  ) {
    return buildElevationData(
      activity,
      elevations,
      activity.distanceStream ?? null,
      "strava",
    );
  }

  const reconstructedElevations =
    buildReconstructedElevationSeries(activity);

  if (reconstructedElevations.length < 2) {
    return null;
  }

  return buildElevationData(
    activity,
    reconstructedElevations,
    null,
    "reconstructed",
  );
}

function buildElevationData(
  activity: Activity,
  elevations: readonly number[],
  distances: readonly number[] | null,
  source: ElevationData["source"],
): ElevationData {
  const maximumPoints = 240;
  const pointCount = Math.min(elevations.length, maximumPoints);
  const hasDistanceStream =
    Array.isArray(distances) && distances.length === elevations.length;
  const points: ElevationPoint[] = [];

  for (let index = 0; index < pointCount; index += 1) {
    const sourceIndex = Math.round(
      (index / Math.max(pointCount - 1, 1)) * (elevations.length - 1),
    );
    const fallbackDistance =
      ((activity.distance ?? 0) * index) / Math.max(pointCount - 1, 1);
    const rawDistance = hasDistanceStream
      ? (distances[sourceIndex] ?? 0) / 1000
      : fallbackDistance;

    points.push({
      distance: Number(rawDistance.toFixed(1)),
      elevation: Math.round(elevations[sourceIndex] ?? 0),
    });
  }

  const seriesMinimum = Math.min(...elevations);
  const seriesMaximum = Math.max(...elevations);
  let ascent = 0;
  let descent = 0;

  for (let index = 1; index < elevations.length; index += 1) {
    const delta = (elevations[index] ?? 0) - (elevations[index - 1] ?? 0);

    if (delta > 0) ascent += delta;
    else descent += Math.abs(delta);
  }

  const minimum =
    source === "reconstructed" &&
    typeof activity.minAltitude === "number"
      ? activity.minAltitude
      : seriesMinimum;
  const maximum =
    source === "reconstructed" &&
    typeof activity.maxAltitude === "number"
      ? activity.maxAltitude
      : seriesMaximum;
  const displayedAscent =
    source === "reconstructed" &&
    typeof activity.elevationGain === "number"
      ? activity.elevationGain
      : ascent;
  const displayedDescent =
    source === "reconstructed"
      ? getReconstructedDescent({
          activity,
          ascent: displayedAscent,
        })
      : descent;

  return {
    points,
    minimum: Math.round(minimum),
    maximum: Math.round(maximum),
    ascent: Math.round(displayedAscent),
    descent:
      displayedDescent === null ? null : Math.round(displayedDescent),
    source,
  };
}

function getReconstructedDescent({
  activity,
  ascent,
}: {
  activity: Activity;
  ascent: number;
}) {
  if (
    typeof activity.elevationLoss === "number" &&
    Number.isFinite(activity.elevationLoss)
  ) {
    return Math.max(0, activity.elevationLoss);
  }

  if (!Number.isFinite(ascent)) {
    return null;
  }

  const loopState = isLoopActivity(activity);

  if (loopState === true) {
    return Math.max(0, ascent);
  }

  return null;
}

function getElevationBounds(activity: Activity) {
  const elevationGain = activity.elevationGain ?? null;
  const explicitMinimum = activity.minAltitude ?? null;
  const explicitMaximum = activity.maxAltitude ?? null;

  if (
    explicitMinimum !== null &&
    explicitMaximum !== null &&
    explicitMaximum > explicitMinimum
  ) {
    return {
      minimum: explicitMinimum,
      maximum: explicitMaximum,
    };
  }

  if (
    explicitMaximum !== null &&
    elevationGain !== null &&
    elevationGain > 0
  ) {
    return {
      minimum: Math.max(
        0,
        explicitMaximum - Math.max(elevationGain * 0.72, 180),
      ),
      maximum: explicitMaximum,
    };
  }

  if (
    explicitMinimum !== null &&
    elevationGain !== null &&
    elevationGain > 0
  ) {
    return {
      minimum: explicitMinimum,
      maximum: explicitMinimum + elevationGain,
    };
  }

  return null;
}

function getSeriesBounds(values: readonly number[]) {
  let minimum = values[0] ?? 0;
  let maximum = values[0] ?? 0;

  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }

  return { minimum, maximum };
}

function getDistanceBetweenPoints(
  pointA: { lat: number; lng: number },
  pointB: { lat: number; lng: number },
) {
  const averageLatitude =
    ((pointA.lat + pointB.lat) / 2) * (Math.PI / 180);
  const horizontalDistance =
    (pointB.lng - pointA.lng) *
    111_320 *
    Math.cos(averageLatitude);
  const verticalDistance = (pointB.lat - pointA.lat) * 110_540;

  return Math.sqrt(
    horizontalDistance * horizontalDistance +
      verticalDistance * verticalDistance,
  );
}

function smoothSeries(values: readonly number[], passes = 2) {
  let smoothed = [...values];

  for (let pass = 0; pass < passes; pass += 1) {
    smoothed = smoothed.map((value, index, currentValues) => {
      const previous = currentValues[index - 1] ?? value;
      const next = currentValues[index + 1] ?? value;

      return previous * 0.25 + value * 0.5 + next * 0.25;
    });
  }

  return smoothed;
}

function buildReconstructedElevationSeries(activity: Activity) {
  const elevationBounds = getElevationBounds(activity);

  if (!elevationBounds) {
    return [];
  }

  const { minimum, maximum } = elevationBounds;
  const altitudeRange = Math.max(maximum - minimum, 1);
  const routePoints = decodePolyline(activity.routePolyline);

  if (routePoints.length < 2) {
    return [
      minimum + altitudeRange * 0.08,
      minimum + altitudeRange * 0.34,
      maximum,
      minimum + altitudeRange * 0.58,
      minimum + altitudeRange * 0.16,
    ];
  }

  const meanLatitude =
    routePoints.reduce((total, point) => total + point.lat, 0) /
    routePoints.length;
  const meanLongitude =
    routePoints.reduce((total, point) => total + point.lng, 0) /
    routePoints.length;
  const projectedX = routePoints.map(
    (point) =>
      (point.lng - meanLongitude) *
      Math.cos((meanLatitude * Math.PI) / 180),
  );
  const projectedY = routePoints.map(
    (point) => point.lat - meanLatitude,
  );
  const radialValues = projectedX.map((value, index) =>
    Math.sqrt(value * value + projectedY[index]! * projectedY[index]!),
  );
  const radialBounds = getSeriesBounds(radialValues);
  const radialRange = Math.max(
    radialBounds.maximum - radialBounds.minimum,
    1e-6,
  );
  const cumulativeDistances = [0];

  for (let index = 1; index < routePoints.length; index += 1) {
    cumulativeDistances.push(
      cumulativeDistances[index - 1]! +
        getDistanceBetweenPoints(
          routePoints[index - 1]!,
          routePoints[index]!,
        ),
    );
  }

  const firstPoint = routePoints[0]!;
  const lastPoint = routePoints.at(-1)!;
  const totalDistance = cumulativeDistances.at(-1) ?? 0;
  const isLoop =
    getDistanceBetweenPoints(firstPoint, lastPoint) < 250;
  const endpointStart = minimum + altitudeRange * 0.1;
  const endpointEnd =
    minimum + altitudeRange * (isLoop ? 0.12 : 0.26);
  const latitudes = routePoints.map((point) => point.lat);
  const latitudeBounds = getSeriesBounds(latitudes);
  const latitudeRange = Math.max(
    latitudeBounds.maximum - latitudeBounds.minimum,
    1e-6,
  );

  const values = routePoints.map((point, index) => {
    const progress =
      totalDistance > 0
        ? cumulativeDistances[index]! / totalDistance
        : index / Math.max(routePoints.length - 1, 1);
    const normalizedNorth =
      (point.lat - latitudeBounds.minimum) / latitudeRange;
    const radialSignal =
      (radialValues[index]! - radialBounds.minimum) / radialRange;
    const reliefSignal =
      normalizedNorth * 0.38 +
      radialSignal * 0.42 +
      Math.sin(progress * Math.PI) * 0.14 +
      Math.sin(progress * Math.PI * 3) * 0.06;
    const baseline =
      endpointStart + (endpointEnd - endpointStart) * progress;

    return baseline + reliefSignal * altitudeRange * 0.82;
  });

  const smoothedValues = smoothSeries(values, 3);
  const smoothedBounds = getSeriesBounds(smoothedValues);
  const smoothedRange = Math.max(
    smoothedBounds.maximum - smoothedBounds.minimum,
    1,
  );

  return smoothedValues.map((value, index) => {
    const normalized =
      (value - smoothedBounds.minimum) / smoothedRange;
    const target = minimum + normalized * altitudeRange;
    const endpointBias =
      index === 0
        ? endpointStart
        : index === smoothedValues.length - 1
          ? endpointEnd
          : target;

    return target * 0.88 + endpointBias * 0.12;
  });
}

export function decodePolyline(polyline: string | null) {
  if (!polyline) return [];

  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

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

    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
  }

  return points;
}
