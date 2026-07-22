export type WorkoutType =
  | "run"
  | "bike"
  | "gym";

export type Workout = {
  id: string;
  title: string;
  type: WorkoutType;
  date: string;
  duration?: number;
};