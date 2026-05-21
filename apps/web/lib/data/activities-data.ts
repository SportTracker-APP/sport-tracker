import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
} from "lucide-react";

export const activities = [
  {
    id: 1,
    title: "Course matinale",
    type: "Course",
    distance: "8.4 km",
    duration: "42 min",
    calories: 560,
    date: "Aujourd’hui",
    icon: Footprints,
  },
  {
    id: 2,
    title: "Sortie vélo",
    type: "Cyclisme",
    distance: "36 km",
    duration: "1h52",
    calories: 1240,
    date: "Hier",
    icon: Bike,
  },
  {
    id: 3,
    title: "Trail forêt",
    type: "Trail",
    distance: "14 km",
    duration: "1h24",
    calories: 980,
    date: "Samedi",
    icon: Mountain,
  },
  {
    id: 4,
    title: "Séance jambes",
    type: "Musculation",
    distance: "-",
    duration: "1h10",
    calories: 430,
    date: "Vendredi",
    icon: Dumbbell,
  },
];