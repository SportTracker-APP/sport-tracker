export type BadgeCategory =
  | 'Distance'
  | 'Sommets'
  | 'Conditions'
  | 'Exploits D+'
  | 'Progression D+'
  | 'Défis mensuels';

export type BadgeRule =
  | { kind: 'TOTAL_DISTANCE'; thresholdKm: number }
  | { kind: 'DISTINCT_SUMMITS'; threshold: number }
  | { kind: 'BEFORE_SUNRISE' }
  | { kind: 'TEMPERATURE_BELOW'; thresholdCelsius: number }
  | { kind: 'RAINY_ACTIVITY' }
  | { kind: 'SINGLE_ACTIVITY_ELEVATION'; thresholdMeters: number }
  | { kind: 'TOTAL_ELEVATION'; thresholdMeters: number }
  | { kind: 'MONTHLY_ELEVATION'; month: number; thresholdMeters: number }
  | { kind: 'MONTHLY_ACTIVITY_COUNT'; month: number; threshold: number }
  | { kind: 'MONTHLY_OUTDOOR_DISTANCE'; month: number; thresholdKm: number }
  | { kind: 'MONTHLY_SUMMITS'; month: number; threshold: number }
  | { kind: 'MONTHLY_DISTANCE'; month: number; thresholdKm: number }
  | {
      kind: 'MONTHLY_LONG_RUNS';
      month: number;
      threshold: number;
      minimumDistanceKm: number;
    }
  | {
      kind: 'MONTHLY_RAIN_AND_DISTANCE';
      month: number;
      thresholdKm: number;
    }
  | { kind: 'MONTHLY_ACTIVE_WEEKS'; month: number; threshold: number };

export type BadgeCatalogItem = {
  id: string;
  name: string;
  description: string;
  hint: string;
  icon: string;
  tone: 'summit' | 'fire' | 'energy' | 'sunrise' | 'winter' | 'rain';
  sortOrder: number;
  category: BadgeCategory;
  criterion: string;
  rule: BadgeRule;
};

export const BADGE_CATALOG = [
  {
    id: 'distance-100-km',
    name: '100 km',
    description: 'Le cap des 100 km cumulés est franchi.',
    hint: 'Cumule 100 km sur toutes tes activités.',
    icon: 'Route',
    tone: 'energy',
    sortOrder: 1,
    category: 'Distance',
    criterion: 'Cumuler 100 km sur toutes les activités',
    rule: { kind: 'TOTAL_DISTANCE', thresholdKm: 100 },
  },
  {
    id: 'distance-500-km',
    name: '500 km',
    description: 'L’explorateur confirmé : 500 km de terrain conquis.',
    hint: 'Cumule 500 km sur toutes tes activités.',
    icon: 'Route',
    tone: 'energy',
    sortOrder: 2,
    category: 'Distance',
    criterion: 'Cumuler 500 km sur toutes les activités',
    rule: { kind: 'TOTAL_DISTANCE', thresholdKm: 500 },
  },
  {
    id: 'first-summit',
    name: 'Premier Sommet',
    description: 'Ton premier sommet identifié rejoint le carnet.',
    hint: 'Atteins un sommet répertorié.',
    icon: 'Mountain',
    tone: 'summit',
    sortOrder: 3,
    category: 'Sommets',
    criterion: 'Atteindre 1 sommet répertorié',
    rule: { kind: 'DISTINCT_SUMMITS', threshold: 1 },
  },
  {
    id: 'summits-10',
    name: '10 Sommets',
    description: 'Dix sommets différents sont désormais dans ton carnet.',
    hint: 'Atteins 10 sommets répertoriés distincts.',
    icon: 'Trophy',
    tone: 'summit',
    sortOrder: 4,
    category: 'Sommets',
    criterion: 'Atteindre 10 sommets répertoriés distincts',
    rule: { kind: 'DISTINCT_SUMMITS', threshold: 10 },
  },
  {
    id: 'condition-sunrise',
    name: 'Lever de soleil',
    description: 'Parti avant l’aube pour attraper les premiers rayons.',
    hint: 'Démarre une activité avant le lever du soleil.',
    icon: 'Sunrise',
    tone: 'sunrise',
    sortOrder: 5,
    category: 'Conditions',
    criterion: 'Démarrer une activité avant le lever du soleil',
    rule: { kind: 'BEFORE_SUNRISE' },
  },
  {
    id: 'condition-winter',
    name: 'Sortie hivernale',
    description: 'Le froid n’a pas empêché la sortie.',
    hint: 'Réalise une activité avec une température négative.',
    icon: 'Snowflake',
    tone: 'winter',
    sortOrder: 6,
    category: 'Conditions',
    criterion: 'Réaliser une activité avec une température < 0 °C',
    rule: { kind: 'TEMPERATURE_BELOW', thresholdCelsius: 0 },
  },
  {
    id: 'condition-rain',
    name: 'Sortie sous la pluie',
    description: 'La météo n’arrête pas un vrai traileur.',
    hint: 'Réalise une activité sous la pluie.',
    icon: 'CloudRain',
    tone: 'rain',
    sortOrder: 7,
    category: 'Conditions',
    criterion: 'Réaliser une activité sous la pluie',
    rule: { kind: 'RAINY_ACTIVITY' },
  },
  ...[
    [500, 'Premiers reliefs (500 m D+)', 'Mountain'],
    [1_000, 'Grimpeur', 'Mountain'],
    [1_500, 'Chasseur de sommets (1 500 m D+)', 'Flame'],
    [2_000, 'Machine à D+ (2 000 m D+)', 'Zap'],
    [3_000, 'Roi des crêtes (3 000 m D+)', 'Trophy'],
    [4_000, 'Gardien des sommets (4 000 m D+)', 'ShieldCheck'],
    [5_000, 'Légende alpine (5 000 m D+)', 'Crown'],
  ].map(([threshold, name, icon], index) => ({
    id: `single-elevation-${threshold}`,
    name: String(name),
    description: `${new Intl.NumberFormat('fr-FR').format(Number(threshold))} m D+ réalisés sur une seule sortie.`,
    hint: `Réalise ${new Intl.NumberFormat('fr-FR').format(Number(threshold))} m D+ sur une sortie.`,
    icon: String(icon),
    tone: index >= 4 ? ('fire' as const) : ('summit' as const),
    sortOrder: 8 + index,
    category: 'Exploits D+' as const,
    criterion: `${new Intl.NumberFormat('fr-FR').format(Number(threshold))} m de dénivelé positif sur une sortie`,
    rule: {
      kind: 'SINGLE_ACTIVITY_ELEVATION' as const,
      thresholdMeters: Number(threshold),
    },
  })),
  {
    id: 'total-elevation-10000-exploit',
    name: '10 000 m D+',
    description: 'Les jambes en feu : 10 000 m de dénivelé positif cumulés.',
    hint: 'Cumule 10 000 m de dénivelé positif.',
    icon: 'Flame',
    tone: 'fire',
    sortOrder: 15,
    category: 'Exploits D+',
    criterion: 'Cumuler 10 000 m de dénivelé positif',
    rule: { kind: 'TOTAL_ELEVATION', thresholdMeters: 10_000 },
  },
  ...[
    [1_000, 'Premiers pas en montagne', 'Footprints'],
    [5_000, 'Habitué des sentiers', 'TreePine'],
    [10_000, 'Maître des sentiers', 'Mountain'],
    [25_000, 'Montagnard', 'Flag'],
    [50_000, 'Conquérant des massifs', 'Trophy'],
    [100_000, 'Seigneur des montagnes', 'Crown'],
  ].map(([threshold, name, icon], index) => ({
    id: `progress-elevation-${threshold}`,
    name: String(name),
    description: `${new Intl.NumberFormat('fr-FR').format(Number(threshold))} m D+ cumulés au total.`,
    hint: `Cumule ${new Intl.NumberFormat('fr-FR').format(Number(threshold))} m D+ au total.`,
    icon: String(icon),
    tone: index >= 3 ? ('fire' as const) : ('energy' as const),
    sortOrder: 16 + index,
    category: 'Progression D+' as const,
    criterion: `${new Intl.NumberFormat('fr-FR').format(Number(threshold))} m D+ cumulés au total`,
    rule: {
      kind: 'TOTAL_ELEVATION' as const,
      thresholdMeters: Number(threshold),
    },
  })),
  {
    id: 'monthly-january-vertical',
    name: 'Janvier Vertical',
    description: 'Commencer l’année en prenant de la hauteur.',
    hint: 'Cumule 3 000 m D+ durant un mois de janvier.',
    icon: 'TrendingUp',
    tone: 'energy',
    sortOrder: 22,
    category: 'Défis mensuels',
    criterion: '3 000 m D+ cumulés durant le mois de janvier',
    rule: { kind: 'MONTHLY_ELEVATION', month: 1, thresholdMeters: 3_000 },
  },
  {
    id: 'monthly-february-ridges',
    name: 'Février des Crêtes',
    description: 'Le froid ne t’arrête pas.',
    hint: 'Réalise 5 activités durant un mois de février.',
    icon: 'Snowflake',
    tone: 'winter',
    sortOrder: 23,
    category: 'Défis mensuels',
    criterion: '5 activités réalisées en février',
    rule: { kind: 'MONTHLY_ACTIVITY_COUNT', month: 2, threshold: 5 },
  },
  {
    id: 'monthly-march-vertical',
    name: 'Mars Vertical',
    description: 'Les jambes se réveillent avec le printemps.',
    hint: 'Cumule 5 000 m D+ durant un mois de mars.',
    icon: 'Sunrise',
    tone: 'sunrise',
    sortOrder: 24,
    category: 'Défis mensuels',
    criterion: '5 000 m D+ cumulés durant mars',
    rule: { kind: 'MONTHLY_ELEVATION', month: 3, thresholdMeters: 5_000 },
  },
  {
    id: 'monthly-april-outdoor',
    name: 'Avril Outdoor',
    description: 'Profiter du retour des beaux jours.',
    hint: 'Parcours 50 km dehors durant un mois d’avril.',
    icon: 'Leaf',
    tone: 'energy',
    sortOrder: 25,
    category: 'Défis mensuels',
    criterion: '50 km parcourus en extérieur durant avril',
    rule: { kind: 'MONTHLY_OUTDOOR_DISTANCE', month: 4, thresholdKm: 50 },
  },
  {
    id: 'monthly-may-summits',
    name: 'Mai des Sommets',
    description: 'Le retour des longues journées.',
    hint: 'Découvre 2 sommets durant un mois de mai.',
    icon: 'Mountain',
    tone: 'summit',
    sortOrder: 26,
    category: 'Défis mensuels',
    criterion: '2 sommets découverts durant le mois de mai',
    rule: { kind: 'MONTHLY_SUMMITS', month: 5, threshold: 2 },
  },
  {
    id: 'monthly-june-alpine',
    name: 'Juin Alpin',
    description: 'Les montagnes rouvrent leurs portes.',
    hint: 'Cumule 8 000 m D+ durant un mois de juin.',
    icon: 'Mountain',
    tone: 'summit',
    sortOrder: 27,
    category: 'Défis mensuels',
    criterion: '8 000 m D+ cumulés durant juin',
    rule: { kind: 'MONTHLY_ELEVATION', month: 6, thresholdMeters: 8_000 },
  },
  {
    id: 'monthly-july-vertical',
    name: 'Juillet Vertical',
    description: 'La chaleur monte, les sentiers aussi.',
    hint: 'Cumule 10 000 m D+ durant un mois de juillet.',
    icon: 'Flame',
    tone: 'fire',
    sortOrder: 28,
    category: 'Défis mensuels',
    criterion: '10 000 m D+ cumulés durant juillet',
    rule: { kind: 'MONTHLY_ELEVATION', month: 7, thresholdMeters: 10_000 },
  },
  {
    id: 'monthly-august-adventure',
    name: 'Août Aventure',
    description: 'Le mois idéal pour partir explorer.',
    hint: 'Parcours 100 km durant un mois d’août.',
    icon: 'Sun',
    tone: 'sunrise',
    sortOrder: 29,
    category: 'Défis mensuels',
    criterion: '100 km parcourus durant août',
    rule: { kind: 'MONTHLY_DISTANCE', month: 8, thresholdKm: 100 },
  },
  {
    id: 'monthly-september-ridges',
    name: 'Septembre des Crêtes',
    description: 'Les couleurs changent, l’envie d’aventure reste.',
    hint: 'Réalise 3 sorties run ou trail de plus de 15 km en septembre.',
    icon: 'Leaf',
    tone: 'energy',
    sortOrder: 30,
    category: 'Défis mensuels',
    criterion: '3 sorties run/trail de plus de 15 km durant septembre',
    rule: {
      kind: 'MONTHLY_LONG_RUNS',
      month: 9,
      threshold: 3,
      minimumDistanceKm: 15,
    },
  },
  {
    id: 'monthly-october-wild',
    name: 'Octobre Sauvage',
    description: 'Parce qu’il n’y a pas de mauvais temps.',
    hint: 'Parcours 50 km et réalise une activité sous la pluie en octobre.',
    icon: 'CloudRain',
    tone: 'rain',
    sortOrder: 31,
    category: 'Défis mensuels',
    criterion: '1 activité sous la pluie et 50 km parcourus durant octobre',
    rule: { kind: 'MONTHLY_RAIN_AND_DISTANCE', month: 10, thresholdKm: 50 },
  },
  {
    id: 'monthly-november-resilient',
    name: 'Novembre Résilient',
    description: 'Le mois où beaucoup abandonnent.',
    hint: 'Réalise 10 activités durant un mois de novembre.',
    icon: 'ShieldCheck',
    tone: 'winter',
    sortOrder: 32,
    category: 'Défis mensuels',
    criterion: '10 activités durant le mois de novembre',
    rule: { kind: 'MONTHLY_ACTIVITY_COUNT', month: 11, threshold: 10 },
  },
  {
    id: 'monthly-december-winter',
    name: 'Décembre Hivernal',
    description: 'Finir l’année dehors.',
    hint: 'Sors au moins une fois par semaine durant un mois de décembre.',
    icon: 'Snowflake',
    tone: 'winter',
    sortOrder: 33,
    category: 'Défis mensuels',
    criterion: 'Sortir au moins une fois par semaine durant décembre',
    rule: { kind: 'MONTHLY_ACTIVE_WEEKS', month: 12, threshold: 4 },
  },
] satisfies BadgeCatalogItem[];
