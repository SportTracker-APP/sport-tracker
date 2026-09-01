import {
  Activity,
  Bike,
  Flame,
  Footprints,
  Mountain,
  Route,
  Trophy,
} from "lucide-react";

export const statsData = [
  {
    title: "Activités",
    value: "19",
    description: "+12% ce mois-ci",
    icon: Activity,
  },
  {
    title: "Distance",
    value: "124 km",
    description: "+29 km cette semaine",
    icon: Route,
  },
  {
    title: "Calories",
    value: "24 300",
    description: "Très bonne progression",
    icon: Flame,
  },
  {
    title: "Objectifs",
    value: "6",
    description: "2 objectifs presque atteints",
    icon: Trophy,
  },
];

export const recentActivities = [
  {
    title: "Course matinale",
    subtitle: "8.4 km • 42 min",
    day: "Aujourd’hui",
    icon: Footprints,
  },
  {
    title: "Sortie vélo",
    subtitle: "36 km • 1h52",
    day: "Hier",
    icon: Bike,
  },
  {
    title: "Trail forêt",
    subtitle: "14 km • 1h24",
    day: "Samedi",
    icon: Mountain,
  },
];

export const monthlyGoal = {
  current: 312,
  target: 420,
  progression: 74,
  remaining: 108,
};
