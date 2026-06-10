"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Footprints,
  Mountain,
  PauseCircle,
  Plus,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FadeIn } from "@/components/ui/fade-in";
import { useActivities } from "@/hooks/use-activities";
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from "@/hooks/use-goals";
import type { Activity as SportActivity } from "@/lib/activities";
import {
  calculateGoalProgress,
  formatGoalValue,
  getGoalPeriodLabel,
  getGoalTypeLabel,
  selectPrimaryGoal,
} from "@/lib/goal-progress";
import type { Goal, GoalPeriod, GoalType } from "@/lib/goals";

const goalTypes: Array<{ value: GoalType; label: string }> = [
  { value: "DISTANCE_KM", label: "Distance" },
  { value: "ACTIVITY_COUNT", label: "Sorties" },
  { value: "ELEVATION_M", label: "Dénivelé" },
  { value: "DURATION_MIN", label: "Temps" },
  { value: "CALORIES", label: "Calories" },
];

const goalPeriods: Array<{ value: GoalPeriod; label: string }> = [
  { value: "MONTHLY", label: "Mois en cours" },
  { value: "WEEKLY", label: "Semaine en cours" },
  { value: "CUSTOM", label: "Période libre" },
];

const goalIcons: Record<GoalType, typeof Footprints> = {
  ACTIVITY_COUNT: Activity,
  CALORIES: Flame,
  DISTANCE_KM: Footprints,
  DURATION_MIN: Clock,
  ELEVATION_M: Mountain,
};

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date);

  nextDate.setDate(nextDate.getDate() + 6);
  nextDate.setHours(23, 59, 59, 999);

  return nextDate;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodDates(period: GoalPeriod, startDate: string, endDate: string) {
  const now = new Date();

  if (period === "WEEKLY") {
    return {
      startDate: startOfWeek(now).toISOString(),
      endDate: endOfWeek(now).toISOString(),
    };
  }

  if (period === "MONTHLY") {
    return {
      startDate: startOfMonth(now).toISOString(),
      endDate: endOfMonth(now).toISOString(),
    };
  }

  return {
    startDate: new Date(`${startDate}T00:00:00`).toISOString(),
    endDate: new Date(`${endDate}T23:59:59`).toISOString(),
  };
}

function getDefaultTitle(type: GoalType, period: GoalPeriod) {
  const periodLabel =
    period === "WEEKLY" ? "hebdo" : period === "MONTHLY" ? "mensuel" : "perso";

  if (type === "DISTANCE_KM") {
    return `Objectif distance ${periodLabel}`;
  }

  if (type === "ACTIVITY_COUNT") {
    return `Objectif sorties ${periodLabel}`;
  }

  if (type === "ELEVATION_M") {
    return `Objectif dénivelé ${periodLabel}`;
  }

  if (type === "DURATION_MIN") {
    return `Objectif temps ${periodLabel}`;
  }

  return `Objectif calories ${periodLabel}`;
}

function GoalCard({
  goal,
  activities,
  onToggle,
  onDelete,
  onEdit,
  isBusy,
}: {
  goal: Goal;
  activities: SportActivity[];
  onToggle: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  isBusy: boolean;
}) {
  const progress = calculateGoalProgress(goal, activities ?? []);
  const Icon = goalIcons[goal.type];

  return (
    <article className="app-premium-surface relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_34%)]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-violet-300">
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-zinc-500 uppercase">
                {getGoalTypeLabel(goal.type)}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {goal.title}
              </h2>
            </div>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              goal.isActive
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
            }`}
          >
            {goal.isActive ? "Actif" : "En pause"}
          </span>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px] sm:items-end">
          <div>
            <p className="text-4xl font-bold tracking-tight text-white">
              {formatGoalValue(progress.current, goal.type)}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              sur {formatGoalValue(goal.target, goal.type)} •{" "}
              {getGoalPeriodLabel(goal.period)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center">
            <p className="text-xs tracking-[0.16em] text-zinc-500 uppercase">
              Progression
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {progress.progress}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.05]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${progress.progress}%` }}
          />
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Encore {formatGoalValue(progress.remaining, goal.type)} à valider pour
          terminer ce cap.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            disabled={isBusy}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-50"
          >
            <Edit3 className="h-4 w-4" />
            Modifier
          </button>

          <button
            type="button"
            onClick={() => onToggle(goal)}
            disabled={isBusy}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            <PauseCircle className="h-4 w-4" />
            {goal.isActive ? "Mettre en pause" : "Réactiver"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(goal)}
            disabled={isBusy}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-500/15 bg-red-500/10 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}

export default function GoalsPage() {
  const { data: goals = [], isLoading, isError, error } = useGoals();
  const { data: activities = [] } = useActivities();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [type, setType] = useState<GoalType>("DISTANCE_KM");
  const [period, setPeriod] = useState<GoalPeriod>("WEEKLY");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("30");
  const [customStartDate, setCustomStartDate] = useState(
    toDateInputValue(new Date()),
  );
  const [customEndDate, setCustomEndDate] = useState(
    toDateInputValue(endOfMonth(new Date())),
  );

  const primaryGoal = useMemo(() => selectPrimaryGoal(goals), [goals]);
  const primaryProgress = useMemo(
    () => calculateGoalProgress(primaryGoal, activities),
    [activities, primaryGoal],
  );
  const averageProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (total, goal) =>
              total + calculateGoalProgress(goal, activities).progress,
            0,
          ) / goals.length,
        )
      : primaryProgress.progress;
  const isBusy =
    createGoalMutation.isPending ||
    updateGoalMutation.isPending ||
    deleteGoalMutation.isPending;
  const mutationError =
    createGoalMutation.error ||
    updateGoalMutation.error ||
    deleteGoalMutation.error ||
    null;

  function getErrorMessage(unknownError: unknown) {
    if (
      unknownError &&
      typeof unknownError === "object" &&
      "response" in unknownError
    ) {
      const response = (
        unknownError as {
          response?: { data?: { message?: string | string[] } };
        }
      ).response;
      const message = response?.data?.message;

      if (Array.isArray(message)) {
        return message.join(" ");
      }

      if (message) {
        return message;
      }
    }

    if (unknownError instanceof Error) {
      return unknownError.message;
    }

    return "Une erreur est survenue. Vérifiez que le backend est lancé et que la base est à jour.";
  }

  function resetForm() {
    setEditingGoal(null);
    setType("DISTANCE_KM");
    setPeriod("WEEKLY");
    setTitle("");
    setTarget("30");
    setCustomStartDate(toDateInputValue(new Date()));
    setCustomEndDate(toDateInputValue(endOfMonth(new Date())));
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setType(goal.type);
    setPeriod(goal.period);
    setTitle(goal.title);
    setTarget(String(goal.target).replace(".", ","));
    setCustomStartDate(toDateInputValue(new Date(goal.startDate)));
    setCustomEndDate(toDateInputValue(new Date(goal.endDate)));
  }

  async function createStarterGoals() {
    const now = new Date();
    const weekDates = {
      startDate: startOfWeek(now).toISOString(),
      endDate: endOfWeek(now).toISOString(),
    };

    await createGoalMutation.mutateAsync({
      title: "30 km cette semaine",
      type: "DISTANCE_KM",
      target: 30,
      period: "WEEKLY",
      ...weekDates,
      isActive: true,
    });

    await createGoalMutation.mutateAsync({
      title: "3 sorties cette semaine",
      type: "ACTIVITY_COUNT",
      target: 3,
      period: "WEEKLY",
      ...weekDates,
      isActive: true,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTarget = Number(target.replace(",", "."));

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      alert("Ajoutez une cible supérieure à 0.");
      return;
    }

    const dates = getPeriodDates(period, customStartDate, customEndDate);

    const payload = {
      title: title.trim() || getDefaultTitle(type, period),
      type,
      target: parsedTarget,
      period,
      ...dates,
      isActive: true,
    };

    if (editingGoal) {
      await updateGoalMutation.mutateAsync({
        id: editingGoal.id,
        input: payload,
      });
    } else {
      await createGoalMutation.mutateAsync(payload);
    }

    resetForm();
  }

  async function handleToggle(goal: Goal) {
    await updateGoalMutation.mutateAsync({
      id: goal.id,
      input: {
        isActive: !goal.isActive,
      },
    });
  }

  async function handleDelete(goal: Goal) {
    if (!window.confirm(`Supprimer “${goal.title}” ?`)) {
      return;
    }

    await deleteGoalMutation.mutateAsync(goal.id);
  }

  return (
    <DashboardLayout>
      <div className="app-goals-page space-y-6">
        <section className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-7 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%)]" />

          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <Target className="h-3.5 w-3.5" />
                Défis outdoor
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white">
                Fixez vos propres défis outdoor, Sport Tracker vous garde dans
                le rythme.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Deux défis de départ sont proposés automatiquement : 30 km cette
                semaine et 3 sorties cette semaine. Modifiez-les, mettez-les en
                pause ou créez vos propres caps selon votre terrain du moment :
                lac, route, sentier ou montagne.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5">
              <p className="text-sm text-zinc-400">Défi prioritaire</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {primaryGoal.title}
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Progression moyenne</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {averageProgress}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-violet-300" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-4">
            {isError && (
              <div className="app-premium-surface rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
                Impossible de charger vos défis : {getErrorMessage(error)}
              </div>
            )}

            {mutationError && (
              <div className="app-premium-surface rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
                Impossible d’enregistrer le défi :{" "}
                {getErrorMessage(mutationError)}
              </div>
            )}

            {isLoading && (
              <div className="app-premium-surface rounded-[24px] border border-white/[0.08] bg-[#181922]/90 p-6 text-sm text-zinc-400">
                Chargement des objectifs...
              </div>
            )}

            {!isLoading && goals.length === 0 && (
              <FadeIn>
                <div className="app-premium-surface rounded-[26px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Aucun objectif créé pour le moment.
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        Sport Tracker va préparer vos deux objectifs de départ.
                        Vous pourrez ensuite les ajuster ou créer un cap plus
                        personnel.
                      </p>
                      <button
                        type="button"
                        onClick={createStarterGoals}
                        disabled={isBusy}
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(16,185,129,0.18)] transition hover:scale-[1.01] disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        Créer mes deux défis de départ
                      </button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {goals.map((goal, index) => (
                <FadeIn key={goal.id} delay={0.08 * index}>
                  <GoalCard
                    goal={goal}
                    activities={activities}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    isBusy={isBusy}
                  />
                </FadeIn>
              ))}
            </div>
          </div>

          <aside className="app-premium-surface h-fit rounded-[28px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingGoal ? "Modifier le défi" : "Créer un objectif"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {editingGoal
                    ? "Ajustez la cible, la période ou le nom."
                    : "Simple, mesurable, visible sur le dashboard."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Nom
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={getDefaultTitle(type, period)}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/40"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as GoalType)}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/40"
                  >
                    {goalTypes.map((goalType) => (
                      <option key={goalType.value} value={goalType.value}>
                        {goalType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Cible
                  </label>
                  <input
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    inputMode="decimal"
                    className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Période
                </label>
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as GoalPeriod)}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/40"
                >
                  {goalPeriods.map((goalPeriod) => (
                    <option key={goalPeriod.value} value={goalPeriod.value}>
                      {goalPeriod.label}
                    </option>
                  ))}
                </select>
              </div>

              {period === "CUSTOM" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Début
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(event) => setCustomStartDate(event.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/40"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Fin
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(event) => setCustomEndDate(event.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/40"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.28)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {editingGoal ? "Enregistrer les modifications" : "Ajouter l’objectif"}
              </button>

              {editingGoal && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isBusy}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.07] disabled:opacity-50"
                >
                  Annuler la modification
                </button>
              )}
            </form>

            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                Conseil
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Un objectif de distance et un objectif de régularité
                fonctionnent très bien ensemble : l’un donne le volume, l’autre
                garde le rythme.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
