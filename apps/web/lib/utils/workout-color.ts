import {
  WorkoutType,
} from "@/lib/types/workout";

export const workoutColors: Record<
  WorkoutType,
  string
> = {
  run: `
    bg-orange-500/10
    text-orange-300
    border-orange-500/20
  `,
  bike: `
    bg-cyan-500/10
    text-cyan-300
    border-cyan-500/20
  `,
  gym: `
    bg-emerald-500/10
    text-emerald-300
    border-emerald-500/20
  `,
};