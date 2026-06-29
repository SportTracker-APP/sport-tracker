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
};

export const SUMMIT_DISCOVERY_ALTITUDE_TOLERANCE_METERS = 150;

export const SUMMIT_DISCOVERY_RADIUS_METERS = 500;

export const SUMMIT_TITLE_MATCH_RADIUS_METERS = 1_200;

export const SUMMIT_CATALOG: Summit[] = [
  {
    id: "mont-veyrier",
    name: "Mont Veyrier",
    altitude: 1291,
    massif: "Annecy",
    difficulty: "Difficile",
    type: "Crête",
    coordinates: [6.18, 45.903],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Lac%20veyrier2.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "mont-baron",
    name: "Mont Baron",
    altitude: 1299,
    massif: "Annecy",
    difficulty: "Difficile",
    type: "Crête",
    coordinates: [6.181, 45.914],
    imageUrl:
      "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageCredit: "Image montagne",
  },
  {
    id: "semnoz",
    name: "Semnoz",
    altitude: 1699,
    massif: "Bauges",
    difficulty: "Modérée",
    type: "Sommet",
    coordinates: [6.104, 45.797],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Semnoz%20vu%20de%20menthon.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "cret-de-chatillon",
    name: "Crêt de Châtillon",
    altitude: 1699,
    massif: "Bauges",
    difficulty: "Modérée",
    type: "Belvédère",
    coordinates: [6.103, 45.797],
    imageUrl:
      "https://images.pexels.com/photos/67517/pexels-photo-67517.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageCredit: "Image montagne",
  },
  {
    id: "roc-de-chere",
    name: "Roc de Chère",
    altitude: 651,
    massif: "Annecy",
    difficulty: "Facile",
    type: "Belvédère",
    coordinates: [6.212, 45.844],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Roc%20de%20Ch%C3%A8re%20-%20Lac%20d%27Annecy.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "parmelan",
    name: "Parmelan",
    altitude: 1856,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.235, 45.963],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Le%20Parmelan%20depuis%20Villaz%20%C3%A0%20l%27ouest.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "la-tournette",
    name: "La Tournette",
    altitude: 2351,
    massif: "Bornes",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.287, 45.827],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/La%20Tournette%20%40%20Lake%20Annecy%20%40%20Saint-Jorioz%20%2850488455392%29.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "pointe-de-talamarche",
    name: "Pointe de Talamarche",
    aliases: ["Talamarche"],
    altitude: 1852,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.25734, 45.85981],
    imageUrl:
      "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageCredit: "Image montagne",
  },
  {
    id: "mont-lachat-de-thones",
    name: "Mont Lachat de Thônes",
    altitude: 2023,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.446, 45.958],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mont%20Lachat%20de%20Th%C3%B4nes.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "aiguille-verte-bargy",
    name: "Aiguille Verte du Bargy",
    aliases: ["Aiguille Verte"],
    altitude: 2045,
    massif: "Bargy",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.432661, 45.982277],
    imageUrl:
      "https://images.pexels.com/photos/355241/pexels-photo-355241.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageCredit: "Image montagne",
  },
  {
    id: "le-buclon",
    name: "Le Buclon",
    altitude: 2072,
    massif: "Bargy",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.445161, 45.98641],
    imageUrl:
      "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageCredit: "Image montagne",
  },
  {
    id: "lanfonnet",
    name: "Lanfonnet",
    altitude: 1768,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Arête",
    coordinates: [6.259, 45.842],
    imageUrl:
      "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageCredit: "Image montagne",
  },
  {
    id: "dent-de-lanfon",
    name: "Dent de Lanfon",
    altitude: 1824,
    massif: "Bornes",
    difficulty: "Expert",
    type: "Arête",
    coordinates: [6.251, 45.849],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Dents%20de%20Lanfon%20falaise%20Nord.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "sulens",
    name: "Sulens",
    altitude: 1839,
    massif: "Aravis",
    difficulty: "Modérée",
    type: "Sommet",
    coordinates: [6.362, 45.85],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mont%20Sulens.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "mont-charvin",
    name: "Mont Charvin",
    altitude: 2409,
    massif: "Aravis",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.41, 45.809],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Le_Mont_Charvin.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "pointe-percee",
    name: "Pointe Percée",
    altitude: 2750,
    massif: "Aravis",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.555, 45.955],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/La%20Pointe%20Perc%C3%A9ee.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "tete-pelouse",
    name: "Tête Pelouse",
    altitude: 2537,
    massif: "Aravis",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.481, 45.978],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/T%C3%AAte%20Pelouse.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "la-sambuy",
    name: "La Sambuy",
    altitude: 2198,
    massif: "Bauges",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.284, 45.692],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Pointe%20de%20la%20Sambuy.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "montagne-de-sous-dine",
    name: "Montagne de Sous-Dine",
    altitude: 2004,
    massif: "Bornes",
    difficulty: "Difficile",
    type: "Sommet",
    coordinates: [6.319, 46.024],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Montagne%20de%20Sous-Dine.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "le-mole",
    name: "Le Môle",
    altitude: 1863,
    massif: "Chablais",
    difficulty: "Modérée",
    type: "Sommet",
    coordinates: [6.457, 46.106],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Le%20M%C3%B4le%20depuis%20Bonneville.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "aiguille-du-midi",
    name: "Aiguille du Midi",
    altitude: 3842,
    massif: "Mont-Blanc",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.887, 45.878],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Aiguille%20du%20Midi%20from%20Chamonix.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "mont-blanc",
    name: "Mont Blanc",
    altitude: 4808,
    massif: "Mont-Blanc",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.865, 45.833],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mont%20Blanc%20Aiguille.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "le-brevent",
    name: "Le Brévent",
    altitude: 2525,
    massif: "Aiguilles Rouges",
    difficulty: "Difficile",
    type: "Belvédère",
    coordinates: [6.837, 45.934],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Br%C3%A9vent%20Depuis%20Chamonix%2019082008.jpg",
    imageCredit: "Wikimedia Commons",
  },
  {
    id: "aiguille-verte",
    name: "Aiguille Verte du Mont-Blanc",
    aliases: ["Aiguille Verte"],
    altitude: 4122,
    massif: "Mont-Blanc",
    difficulty: "Expert",
    type: "Sommet",
    coordinates: [6.969, 45.934],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Aiguille%20Verte%20from%20Aiguille%20du%20Midi.jpg",
    imageCredit: "Wikimedia Commons",
  },
];

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
