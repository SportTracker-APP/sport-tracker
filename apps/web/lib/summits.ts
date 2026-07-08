export type SummitDifficulty = "Facile" | "Modérée" | "Difficile" | "Expert";

export type SummitType = "Crête" | "Sommet" | "Belvédère" | "Arête";

export type Summit = {
  id: string;
  name: string;
  aliases?: string[];
  altitude: number;
  massif: string;
  difficulty: SummitDifficulty;
  type: SummitType;
  coordinates: readonly [number, number];
  imageUrl?: string;
  imageCredit?: string;
  sourceUrl?: string;
};

export function getDistanceMeters(
  firstPoint: { lat: number; lng: number },
  secondPoint: { lat: number; lng: number },
) {
  const earthRadius = 6_371_000;
  const firstLat = (firstPoint.lat * Math.PI) / 180;
  const secondLat = (secondPoint.lat * Math.PI) / 180;
  const deltaLat = ((secondPoint.lat - firstPoint.lat) * Math.PI) / 180;
  const deltaLng = ((secondPoint.lng - firstPoint.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeSummitName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
