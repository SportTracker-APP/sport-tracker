import { api } from "./api";

export type GoalType =
  | "DISTANCE_KM"
  | "ACTIVITY_COUNT"
  | "ELEVATION_M"
  | "CALORIES"
  | "DURATION_MIN";

export type GoalPeriod = "WEEKLY" | "MONTHLY" | "CUSTOM";

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateGoalInput = {
  title: string;
  type: GoalType;
  target: number;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  isActive?: boolean;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;

export async function getGoals() {
  const { data } = await api.get<Goal[]>("/goals");

  return data;
}

export async function createGoal(input: CreateGoalInput) {
  const { data } = await api.post<Goal>("/goals", input);

  return data;
}

export async function updateGoal(id: string, input: UpdateGoalInput) {
  const { data } = await api.patch<Goal>(`/goals/${id}`, input);

  return data;
}

export async function deleteGoal(id: string) {
  await api.delete(`/goals/${id}`);
}
