"use client";

import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Footprints,
  History,
  Mountain,
  MoreHorizontal,
  PauseCircle,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
  getGoalPeriodBounds,
  getStoredGoalPeriodBounds,
  getGoalTypeLabel,
  selectPrimaryGoal,
  type GoalProgress,
} from "@/lib/goal-progress";
import type {
  Goal,
  GoalPeriod,
  GoalType,
  SportType,
} from "@/lib/goals";

import styles from "./goals-page.module.css";

type GoalFilter = "ACTIVE" | "PAUSED" | "COMPLETED" | "ALL";

type GoalTypeOption = {
  value: GoalType;
  label: string;
  unit: string;
  icon: typeof Footprints;
};

const goalTypes: GoalTypeOption[] = [
  {
    value: "DISTANCE_KM",
    label: "Distance",
    unit: "km",
    icon: Footprints,
  },
  {
    value: "ACTIVITY_COUNT",
    label: "Sorties",
    unit: "sorties",
    icon: Activity,
  },
  {
    value: "ELEVATION_M",
    label: "Dénivelé",
    unit: "m D+",
    icon: Mountain,
  },
  {
    value: "DURATION_MIN",
    label: "Temps",
    unit: "min",
    icon: Clock,
  },
  {
    value: "CALORIES",
    label: "Calories",
    unit: "kcal",
    icon: Flame,
  },
];

const goalPeriods: Array<{ value: GoalPeriod; label: string }> = [
  { value: "MONTHLY", label: "Mois en cours" },
  { value: "WEEKLY", label: "Semaine en cours" },
  { value: "CUSTOM", label: "Période libre" },
];

type GoalSportOption = {
  value: SportType | "";
  label: string;
};

const goalSports: GoalSportOption[] = [
  { value: "", label: "Tous les sports" },
  { value: "RUNNING", label: "Course à pied" },
  { value: "TRAIL", label: "Trail" },
  { value: "HIKING", label: "Randonnée" },
  { value: "WALKING", label: "Marche" },
  { value: "ROAD_CYCLING", label: "Vélo de route" },
  { value: "MTB", label: "VTT" },
  { value: "GRAVEL", label: "Gravel" },
  { value: "SWIMMING", label: "Natation" },
  { value: "GYM", label: "Musculation" },
  { value: "FITNESS", label: "Fitness" },
  { value: "SKI", label: "Ski" },
  { value: "SNOWBOARD", label: "Snowboard" },
  { value: "CLIMBING", label: "Escalade" },
];

function getGoalSportLabel(sport: SportType | null | undefined) {
  return goalSports.find((option) => option.value === sport)?.label ?? "Tous les sports";
}

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

function getDefaultTitle(
  type: GoalType,
  period: GoalPeriod,
  sport: SportType | "",
) {
  const periodLabel =
    period === "WEEKLY" ? "hebdo" : period === "MONTHLY" ? "mensuel" : "perso";
  const sportLabel = sport
    ? ` ${getGoalSportLabel(sport).toLocaleLowerCase("fr-FR")}`
    : "";

  if (type === "DISTANCE_KM") {
    return `Objectif distance${sportLabel} ${periodLabel}`;
  }

  if (type === "ACTIVITY_COUNT") {
    return `Objectif sorties${sportLabel} ${periodLabel}`;
  }

  if (type === "ELEVATION_M") {
    return `Objectif dénivelé${sportLabel} ${periodLabel}`;
  }

  if (type === "DURATION_MIN") {
    return `Objectif temps${sportLabel} ${periodLabel}`;
  }

  return `Objectif calories${sportLabel} ${periodLabel}`;
}

function formatGoalPeriodRange(
  period: GoalPeriod,
  startDate: Date,
  endDate: Date,
) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Période à définir";
  }

  const prefix =
    period === "WEEKLY"
      ? "Semaine"
      : period === "MONTHLY"
        ? "Mois"
        : "Période";
  const sameMonth =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();
  const startLabel = sameMonth
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(startDate)
    : new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
      }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(endDate);

  return `${prefix} du ${startLabel} au ${endLabel}`;
}

type GoalDisplaySnapshot = {
  progress: GoalProgress;
  startDate: Date;
  endDate: Date;
  statusLabel: string;
  isArchived: boolean;
};

function getNextGoalPeriodStart(period: GoalPeriod, startDate: Date) {
  const nextDate = new Date(startDate);

  if (period === "MONTHLY") {
    nextDate.setMonth(nextDate.getMonth() + 1, 1);
    nextDate.setHours(0, 0, 0, 0);

    return nextDate;
  }

  nextDate.setDate(nextDate.getDate() + 7);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function getCompletedGoalSnapshots(
  goal: Goal,
  activities: SportActivity[],
) {
  const snapshots: Array<{ goal: Goal; snapshot: GoalDisplaySnapshot }> = [];

  if (goal.period === "CUSTOM") {
    const bounds = getStoredGoalPeriodBounds(goal);
    const progress = calculateGoalProgress(goal, activities, { bounds });

    if (progress.remaining <= 0) {
      snapshots.push({
        goal,
        snapshot: {
          progress,
          ...bounds,
          statusLabel: "Terminé",
          isArchived: bounds.endDate.getTime() < Date.now(),
        },
      });
    }

    return snapshots;
  }

  const firstPeriod = getStoredGoalPeriodBounds(goal);
  const currentPeriod = getGoalPeriodBounds(goal);
  let periodStart = firstPeriod.startDate;
  let guard = 0;

  while (
    periodStart.getTime() <= currentPeriod.startDate.getTime() &&
    guard < 180
  ) {
    const bounds = getGoalPeriodBounds(goal, periodStart);
    const progress = calculateGoalProgress(goal, activities, { bounds });

    if (progress.remaining <= 0) {
      snapshots.push({
        goal,
        snapshot: {
          progress,
          ...bounds,
          statusLabel: "Terminé",
          isArchived:
            bounds.endDate.getTime() < currentPeriod.startDate.getTime(),
        },
      });
    }

    periodStart = getNextGoalPeriodStart(goal.period, periodStart);
    guard += 1;
  }

  return snapshots.sort(
    (firstSnapshot, secondSnapshot) =>
      secondSnapshot.snapshot.endDate.getTime() -
      firstSnapshot.snapshot.endDate.getTime(),
  );
}

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

function GoalCard({
  goal,
  activities,
  snapshot,
  onToggle,
  onMakePrimary,
  onDelete,
  onEdit,
  isBusy,
}: {
  goal: Goal;
  activities: SportActivity[];
  snapshot?: GoalDisplaySnapshot;
  onToggle: (goal: Goal) => void;
  onMakePrimary: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  isBusy: boolean;
}) {
  const progress = snapshot?.progress ?? calculateGoalProgress(goal, activities ?? []);
  const progressPercent = Math.max(0, Math.min(progress.progress, 100));
  const Icon = goalIcons[goal.type];
  const isCompleted = progress.remaining <= 0;
  const activeBounds = getGoalPeriodBounds(goal);
  const displayStartDate = snapshot?.startDate ?? activeBounds.startDate;
  const displayEndDate = snapshot?.endDate ?? activeBounds.endDate;
  const periodLabel = formatGoalPeriodRange(
    goal.period,
    displayStartDate,
    displayEndDate,
  );
  const progressStyle = {
    "--goal-progress": `${progressPercent}%`,
  } as CSSProperties;

  return (
    <article
      className={`${styles.goalCard} ${
        goal.isActive ? "" : styles.goalCardPaused
      } ${goal.isPrimary && !snapshot ? styles.goalCardPrimary : ""}`}
    >
      <div className={styles.goalCardHeader}>
        <div className={styles.goalIdentity}>
          <div className={styles.goalIcon}>
            <Icon aria-hidden="true" />
          </div>

          <div className={styles.goalTitleGroup}>
            <div className={styles.goalMetaLine}>
              <span>{getGoalTypeLabel(goal.type)}</span>
              {goal.sport && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{getGoalSportLabel(goal.sport)}</span>
                </>
              )}
              <span aria-hidden="true">•</span>
              <span>{periodLabel}</span>
            </div>
            <h3>{goal.title}</h3>
          </div>
        </div>

        <div className={styles.goalHeaderActions}>
          <span
            className={`${styles.statusBadge} ${
              snapshot
                ? styles.statusActive
                : goal.isPrimary
                ? styles.statusPrimary
                : goal.isActive
                  ? styles.statusActive
                  : styles.statusPaused
            }`}
          >
            {!snapshot && goal.isPrimary ? <Star aria-hidden="true" /> : null}
            {snapshot?.statusLabel ??
              (goal.isPrimary ? "Principal" : goal.isActive ? "Actif" : "En pause")}
          </span>

          <details className={styles.goalMenu}>
            <summary aria-label={`Actions pour ${goal.title}`}>
              <MoreHorizontal aria-hidden="true" />
            </summary>

            <div className={styles.goalMenuContent}>
              {!snapshot && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                    onMakePrimary(goal);
                  }}
                  disabled={isBusy || Boolean(goal.isPrimary)}
                >
                  <Star aria-hidden="true" />
                  {goal.isPrimary ? "Déjà principal" : "Choisir comme principal"}
                </button>
              )}

              <button
                type="button"
                onClick={() => onEdit(goal)}
                disabled={isBusy}
              >
                <Edit3 aria-hidden="true" />
                Modifier
              </button>

              <button
                type="button"
                onClick={() => onToggle(goal)}
                disabled={isBusy}
              >
                <PauseCircle aria-hidden="true" />
                {goal.isActive ? "Mettre en pause" : "Réactiver"}
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  onDelete(goal);
                }}
                disabled={isBusy}
                className={styles.deleteAction}
                aria-haspopup="dialog"
              >
                <Trash2 aria-hidden="true" />
                Supprimer
              </button>
            </div>
          </details>
        </div>
      </div>

      <div className={styles.goalProgressRow}>
        <div>
          <span className={styles.currentValue}>
            {formatGoalValue(progress.current, goal.type)}
          </span>
          <span className={styles.targetValue}>
            / {formatGoalValue(goal.target, goal.type)}
          </span>
        </div>

        <div className={styles.progressPercentage}>
          <span>Progression</span>
          <strong>{progress.progress}%</strong>
        </div>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={progressStyle} />
      </div>

      <div className={styles.goalFooter}>
        <p className={isCompleted ? styles.completedMessage : undefined}>
          {isCompleted
            ? snapshot?.isArchived
              ? "Objectif terminé sur cette période."
              : "Objectif atteint. Beau travail."
            : `Encore ${formatGoalValue(
                progress.remaining,
                goal.type,
              )} pour terminer ce cap.`}
        </p>

        <span>
          <CalendarDays aria-hidden="true" />
          {periodLabel}
        </span>
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
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<GoalFilter>("ACTIVE");
  const [type, setType] = useState<GoalType>("DISTANCE_KM");
  const [sport, setSport] = useState<SportType | "">("");
  const [period, setPeriod] = useState<GoalPeriod>("WEEKLY");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("30");
  const [customStartDate, setCustomStartDate] = useState(
    toDateInputValue(new Date()),
  );
  const [customEndDate, setCustomEndDate] = useState(
    toDateInputValue(endOfMonth(new Date())),
  );

  const primaryGoal = useMemo(
    () => (goals.length > 0 ? selectPrimaryGoal(goals) : null),
    [goals],
  );
  const primaryProgress = useMemo(
    () =>
      primaryGoal ? calculateGoalProgress(primaryGoal, activities) : null,
    [activities, primaryGoal],
  );

  const goalProgressById = useMemo(
    () =>
      new Map(
        goals.map((goal) => [
          goal.id,
          calculateGoalProgress(goal, activities),
        ]),
      ),
    [activities, goals],
  );
  const goalPeriodSnapshotById = useMemo(
    () =>
      new Map(
        goals.map((goal) => {
          const progress =
            goalProgressById.get(goal.id) ??
            calculateGoalProgress(goal, activities);
          const { startDate, endDate } = getGoalPeriodBounds(goal);

          return [
            goal.id,
            {
              progress,
              startDate,
              endDate,
              statusLabel: progress.remaining <= 0 ? "Terminé" : "Actif",
              isArchived: false,
            } satisfies GoalDisplaySnapshot,
          ];
        }),
      ),
    [activities, goalProgressById, goals],
  );

  const activeGoals = goals.filter((goal) => goal.isActive);
  const pausedGoals = goals.filter((goal) => !goal.isActive);
  const completedGoalSnapshots = goals.flatMap((goal) =>
    getCompletedGoalSnapshots(goal, activities),
  );
  const visibleGoals = goals.filter((goal) => {
    if (filter === "ACTIVE") {
      return goal.isActive;
    }

    if (filter === "PAUSED") {
      return !goal.isActive;
    }

    if (filter === "COMPLETED") {
      return false;
    }

    return true;
  });

  const averageProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (total, goal) =>
              total + (goalProgressById.get(goal.id)?.progress ?? 0),
            0,
          ) / goals.length,
        )
      : 0;

  const selectedGoalType =
    goalTypes.find((goalType) => goalType.value === type) ?? goalTypes[0];

  const isBusy =
    createGoalMutation.isPending ||
    updateGoalMutation.isPending ||
    deleteGoalMutation.isPending;
  const mutationError =
    createGoalMutation.error ||
    updateGoalMutation.error ||
    deleteGoalMutation.error ||
    null;

  function resetForm() {
    setEditingGoal(null);
    setType("DISTANCE_KM");
    setSport("");
    setPeriod("WEEKLY");
    setTitle("");
    setTarget("30");
    setCustomStartDate(toDateInputValue(new Date()));
    setCustomEndDate(toDateInputValue(endOfMonth(new Date())));
  }

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      document
        .getElementById("goal-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setType(goal.type);
    setSport(goal.sport ?? "");
    setPeriod(goal.period);
    setTitle(goal.title);
    setTarget(String(goal.target).replace(".", ","));
    setCustomStartDate(toDateInputValue(new Date(goal.startDate)));
    setCustomEndDate(toDateInputValue(new Date(goal.endDate)));
    scrollToForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTarget = Number(target.replace(",", "."));

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      window.alert("Ajoutez une cible supérieure à 0.");
      return;
    }

    const dates = getPeriodDates(period, customStartDate, customEndDate);
    const payload = {
      title: title.trim() || getDefaultTitle(type, period, sport),
      type,
      sport: sport || null,
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

  async function handleMakePrimary(goal: Goal) {
    await updateGoalMutation.mutateAsync({
      id: goal.id,
      input: {
        isActive: true,
        isPrimary: true,
      },
    });
  }

  function handleDelete(goal: Goal) {
    deleteGoalMutation.reset();
    setGoalToDelete(goal);
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (open || deleteGoalMutation.isPending) {
      return;
    }

    setGoalToDelete(null);
    deleteGoalMutation.reset();
  }

  async function handleConfirmDelete() {
    if (!goalToDelete) {
      return;
    }

    try {
      await deleteGoalMutation.mutateAsync(goalToDelete.id);

      if (editingGoal?.id === goalToDelete.id) {
        resetForm();
      }

      setGoalToDelete(null);
      deleteGoalMutation.reset();
    } catch {
      // La mutation conserve son erreur pour l'afficher dans la modale.
    }
  }

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <FadeIn delay={0.05}>
          <section className={styles.hero}>
            <div className={styles.heroPhoto} aria-hidden="true" />
            <div className={styles.heroOverlay} aria-hidden="true" />

            <div className={styles.heroContent}>
              <div className={styles.heroCopy}>
                <div className={styles.heroKicker}>
                  <Target aria-hidden="true" />
                  Objectifs du moment
                </div>

                <h1>Garde le cap, avance à ton rythme.</h1>
                <p>
                  Des objectifs simples, lisibles et motivants pour transformer
                  chaque sortie en progression concrète.
                </p>

                <div className={styles.heroActions}>
                  <a href="#goal-form" className={styles.primaryButton}>
                    <Plus aria-hidden="true" />
                    Nouvel objectif
                  </a>

                  <div className={styles.heroFacts}>
                    <span>
                      <strong>{activeGoals.length}</strong> actif
                      {activeGoals.length > 1 ? "s" : ""}
                    </span>
                    <span>
                      <strong>{averageProgress}%</strong> de progression moyenne
                    </span>
                  </div>
                </div>
              </div>

              {primaryGoal && primaryProgress ? (
                <div className={styles.priorityCard}>
                  <div className={styles.priorityHeader}>
                    <div>
                      <span>Cap prioritaire</span>
                      <h2>{primaryGoal.title}</h2>
                    </div>
                    <div className={styles.priorityIcon}>
                      <Trophy aria-hidden="true" />
                    </div>
                  </div>

                  <div className={styles.priorityProgress}>
                    <div>
                      <span>Progression</span>
                      <strong>{primaryProgress.progress}%</strong>
                    </div>
                    <p>
                      {formatGoalValue(primaryProgress.current, primaryGoal.type)}
                      <span>
                        / {formatGoalValue(primaryGoal.target, primaryGoal.type)}
                      </span>
                    </p>
                  </div>

                  <div className={styles.priorityTrack} aria-hidden="true">
                    <div
                      style={
                        {
                          "--priority-progress": `${Math.max(
                            0,
                            Math.min(primaryProgress.progress, 100),
                          )}%`,
                        } as CSSProperties
                      }
                    />
                  </div>

                  <div className={styles.priorityStatus}>
                    <TrendingUp aria-hidden="true" />
                    {primaryProgress.remaining <= 0
                      ? "Objectif atteint"
                      : `Encore ${formatGoalValue(
                          primaryProgress.remaining,
                          primaryGoal.type,
                        )}`}
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles.priorityCard} ${styles.priorityCardEmpty}`}
                >
                  <div className={styles.priorityHeader}>
                    <div>
                      <span>Cap prioritaire</span>
                      <h2>Aucun objectif actif</h2>
                    </div>
                    <div className={styles.priorityIcon}>
                      <Target aria-hidden="true" />
                    </div>
                  </div>

                  <div className={styles.priorityStatus}>
                    <Sparkles aria-hidden="true" />
                    Définis ton prochain cap quand tu seras prêt.
                  </div>

                  <button
                    type="button"
                    onClick={scrollToForm}
                    className={styles.primaryButton}
                  >
                    <Plus aria-hidden="true" />
                    Créer un objectif
                  </button>
                </div>
              )}
            </div>
          </section>
        </FadeIn>

        <div className={styles.contentGrid}>
          <section className={styles.goalsPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>
                  <Target aria-hidden="true" />
                  <h2>Caps en cours</h2>
                </div>
                <p>Suis ce qui compte, sans surcharger ton tableau de bord.</p>
              </div>

              <div className={styles.filters} role="group" aria-label="Filtrer les objectifs">
                <button
                  type="button"
                  onClick={() => setFilter("ACTIVE")}
                  aria-pressed={filter === "ACTIVE"}
                >
                  Actifs
                  <span>{activeGoals.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("PAUSED")}
                  aria-pressed={filter === "PAUSED"}
                >
                  En pause
                  <span>{pausedGoals.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("COMPLETED")}
                  aria-pressed={filter === "COMPLETED"}
                >
                  Terminés
                  <span>{completedGoalSnapshots.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  aria-pressed={filter === "ALL"}
                >
                  Tous
                  <span>{goals.length}</span>
                </button>
              </div>
            </div>

            {isError && (
              <div className={styles.errorState}>
                Impossible de charger tes objectifs : {getErrorMessage(error)}
              </div>
            )}

            {mutationError && (
              <div className={styles.errorState}>
                Impossible d’enregistrer l’objectif : {getErrorMessage(mutationError)}
              </div>
            )}

            {isLoading && (
              <div className={styles.loadingState}>
                <span />
                Chargement de tes objectifs…
              </div>
            )}

            {!isLoading && goals.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <CheckCircle2 aria-hidden="true" />
                </div>
                <div>
                  <h3>Ton prochain cap commence ici.</h3>
                  <p>
                    Aucun objectif n’est imposé. Créez uniquement le cap qui te
                    correspond, au moment qui te convient.
                  </p>
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className={styles.secondaryButton}
                  >
                    <Plus aria-hidden="true" />
                    Créer un objectif
                  </button>
                </div>
              </div>
            )}

            {!isLoading &&
              goals.length > 0 &&
              (filter === "COMPLETED"
                ? completedGoalSnapshots.length === 0
                : visibleGoals.length === 0) && (
              <div className={styles.filterEmptyState}>
                Aucun objectif dans cette catégorie.
              </div>
            )}

            <div className={styles.goalsList}>
              {filter === "COMPLETED"
                ? completedGoalSnapshots.map(({ goal, snapshot }, index) => (
                    <FadeIn
                      key={`${goal.id}-${snapshot.startDate.toISOString()}`}
                      delay={0.05 * index}
                    >
                      <GoalCard
                        goal={goal}
                        activities={activities}
                        snapshot={snapshot}
                        onToggle={handleToggle}
                        onMakePrimary={handleMakePrimary}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        isBusy={isBusy}
                      />
                    </FadeIn>
                  ))
                : visibleGoals.map((goal, index) => (
                <FadeIn key={goal.id} delay={0.05 * index}>
                  <GoalCard
                    goal={goal}
                    activities={activities}
                    onToggle={handleToggle}
                    onMakePrimary={handleMakePrimary}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    isBusy={isBusy}
                  />
                </FadeIn>
              ))}
            </div>
          </section>

          <aside className={styles.sidebarColumn}>
            <section id="goal-form" className={styles.formCard}>
              <div className={styles.cardHeading}>
                <div className={styles.cardHeadingIcon}>
                  <Plus aria-hidden="true" />
                </div>
                <div>
                  <h2>{editingGoal ? "Modifier l’objectif" : "Créer un objectif"}</h2>
                  <p>
                    {editingGoal
                      ? "Ajuste la cible sans perdre ta progression."
                      : "Un cap clair, mesurable et motivant."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <fieldset className={styles.typeFieldset}>
                  <legend>Type d’objectif</legend>
                  <div className={styles.typeGrid}>
                    {goalTypes.map((goalType) => {
                      const Icon = goalType.icon;
                      const isSelected = type === goalType.value;

                      return (
                        <button
                          key={goalType.value}
                          type="button"
                          onClick={() => setType(goalType.value)}
                          aria-pressed={isSelected}
                          className={isSelected ? styles.typeSelected : undefined}
                        >
                          <Icon aria-hidden="true" />
                          <span>{goalType.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className={styles.field}>
                  <span>Sport concerné</span>
                  <select
                    value={sport}
                    onChange={(event) =>
                      setSport(event.target.value as SportType | "")
                    }
                  >
                    {goalSports.map((goalSport) => (
                      <option key={goalSport.value || "ALL"} value={goalSport.value}>
                        {goalSport.label}
                      </option>
                    ))}
                  </select>
                  <small className={styles.fieldHint}>
                    Choisis un sport pour filtrer tes activités, ou
                    laisse “Tous les sports”.
                  </small>
                </label>

                <label className={styles.field}>
                  <span>Nom de l’objectif</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={getDefaultTitle(type, period, sport)}
                  />
                </label>

                <div className={styles.formRow}>
                  <label className={styles.field}>
                    <span>Cible</span>
                    <div className={styles.inputWithUnit}>
                      <input
                        value={target}
                        onChange={(event) => setTarget(event.target.value)}
                        inputMode="decimal"
                        aria-describedby="goal-target-unit"
                      />
                      <span id="goal-target-unit">{selectedGoalType.unit}</span>
                    </div>
                  </label>

                  <label className={styles.field}>
                    <span>Période</span>
                    <select
                      value={period}
                      onChange={(event) =>
                        setPeriod(event.target.value as GoalPeriod)
                      }
                    >
                      {goalPeriods.map((goalPeriod) => (
                        <option key={goalPeriod.value} value={goalPeriod.value}>
                          {goalPeriod.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {period === "CUSTOM" && (
                  <div className={styles.formRow}>
                    <label className={styles.field}>
                      <span>Début</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(event) =>
                          setCustomStartDate(event.target.value)
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Fin</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(event) => setCustomEndDate(event.target.value)}
                      />
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBusy}
                  className={styles.submitButton}
                >
                  <Plus aria-hidden="true" />
                  {editingGoal
                    ? "Enregistrer les modifications"
                    : "Ajouter l’objectif"}
                </button>

                {editingGoal && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isBusy}
                    className={styles.cancelButton}
                  >
                    Annuler la modification
                  </button>
                )}
              </form>
            </section>

            <section className={styles.adviceCard}>
              <div className={styles.adviceArt} aria-hidden="true" />
              <div className={styles.adviceContent}>
                <div className={styles.adviceIcon}>
                  <Sparkles aria-hidden="true" />
                </div>
                <div>
                  <h2>Conseil du refuge</h2>
                  <p>
                    Associez un objectif de distance à un objectif de régularité :
                    l’un donne le volume, l’autre protège le rythme.
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.historyCard}>
              <div className={styles.historyHeader}>
                <div>
                  <History aria-hidden="true" />
                  <h2>Objectifs accomplis</h2>
                </div>
                <span>{completedGoalSnapshots.length}</span>
              </div>

              {completedGoalSnapshots.length > 0 ? (
                <div className={styles.historyList}>
                  {completedGoalSnapshots.slice(0, 3).map(({ goal, snapshot }) => (
                    <div key={`${goal.id}-${snapshot.startDate.toISOString()}`}>
                      <div>
                        <strong>{goal.title}</strong>
                        <span>
                          {formatGoalPeriodRange(
                            goal.period,
                            snapshot.startDate,
                            snapshot.endDate,
                          )}
                        </span>
                      </div>
                      <CheckCircle2 aria-hidden="true" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.historyEmpty}>
                  Ton premier objectif terminé apparaîtra ici.
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>

      <ConfirmationDialog
        open={goalToDelete !== null}
        title="Supprimer cet objectif ?"
        description={
          goalToDelete
            ? `L’objectif “${goalToDelete.title}” sera définitivement supprimé. Cette action ne peut pas être annulée.`
            : "Cet objectif sera définitivement supprimé."
        }
        confirmLabel="Supprimer l’objectif"
        cancelLabel="Conserver l’objectif"
        tone="default"
        icon={<Trash2 aria-hidden="true" />}
        isLoading={deleteGoalMutation.isPending}
        errorMessage={
          deleteGoalMutation.error
            ? getErrorMessage(deleteGoalMutation.error)
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
      />
    </DashboardLayout>
  );
}
