"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Gauge,
  Loader2,
  MapPin,
  Mountain,
  NotebookPen,
  Route,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  createActivitySchema,
  type CreateActivityInput,
} from "@/lib/schemas/activity.schema";

import {
  getActivitySport,
  type ActivitySportValue,
} from "./activity-form.constants";
import { MetricsInput } from "./metrics-input";
import { SportSelector } from "./sport-selector";
import styles from "./create-activity-form.module.css";

type ActivityMode = "COMPLETED" | "PLANNED";

type FormSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

const modeOptions = [
  {
    value: "COMPLETED" as const,
    label: "Activité réalisée",
    description:
      "Ajoutez une sortie déjà terminée avec ses résultats.",
    icon: CheckCircle2,
  },
  {
    value: "PLANNED" as const,
    label: "Sortie à planifier",
    description:
      "Préparez une séance qui apparaîtra dans le calendrier.",
    icon: CalendarPlus,
  },
] as const;

function FormSection({
  eyebrow,
  title,
  description,
  icon,
  children,
}: FormSectionProps) {
  return (
    <section className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>

        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
      </div>

      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}

function getSafeReturnPath(value: string | null) {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "/activites";
}

function getDefaultStartedAt(plannedDate: string | null) {
  if (
    plannedDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(plannedDate)
  ) {
    return `${plannedDate}T12:00`;
  }

  return new Date().toISOString().slice(0, 16);
}

function toSafeInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDuration(hours: number, minutes: number) {
  if (hours === 0 && minutes === 0) {
    return "Non renseignée";
  }

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes.toString().padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  if (!value) {
    return "Date à définir";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date à définir";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMetric(
  value: number | undefined,
  unit: string,
) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(value)} ${unit}`;
}

export function CreateActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plannedDate = searchParams.get("date");
  const requestedStatus = searchParams.get("status");
  const safeReturnTo = getSafeReturnPath(
    searchParams.get("returnTo"),
  );
  const initialMode: ActivityMode =
    requestedStatus === "PLANNED"
      ? "PLANNED"
      : "COMPLETED";

  const [activityMode, setActivityMode] =
    useState<ActivityMode>(initialMode);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [submitError, setSubmitError] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      sport: "TRAIL",
      status: initialMode,
      title:
        initialMode === "PLANNED" ? "Séance prévue" : "",
      distance: 0,
      duration: 0,
      elevationGain: 0,
      calories: 0,
      startedAt: getDefaultStartedAt(plannedDate),
      notes: "",
      returnTo: safeReturnTo,
    },
  });

  const selectedSport = watch("sport");
  const title = watch("title");
  const startedAt = watch("startedAt");
  const distance = watch("distance");
  const elevationGain = watch("elevationGain");
  const calories = watch("calories");
  const notes = watch("notes");
  const totalDuration = hours * 60 + minutes;
  const isPlannedMode = activityMode === "PLANNED";
  const sport = getActivitySport(selectedSport);
  const SportIcon = sport.icon;

  const summary = useMemo(
    () => [
      {
        label: "Statut",
        value: isPlannedMode
          ? "Planifiée"
          : "Réalisée",
        icon: isPlannedMode
          ? CalendarDays
          : CheckCircle2,
      },
      {
        label: "Sport",
        value: sport.label,
        icon: sport.icon,
      },
      {
        label: "Créneau",
        value: formatDateTime(startedAt),
        icon: Clock3,
      },
      {
        label: "Durée",
        value: isPlannedMode
          ? "À compléter après la sortie"
          : formatDuration(hours, minutes),
        icon: Gauge,
      },
    ],
    [
      hours,
      isPlannedMode,
      minutes,
      sport,
      startedAt,
    ],
  );

  useEffect(() => {
    setValue("duration", totalDuration, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue, totalDuration]);

  useEffect(() => {
    setValue("status", activityMode, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (
      activityMode === "PLANNED" &&
      title.trim().length === 0
    ) {
      setValue("title", "Séance prévue", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [activityMode, setValue, title]);

  async function onSubmit(data: CreateActivityInput) {
    setSubmitError(null);

    try {
      const {
        notes: activityNotes,
        returnTo: _returnTo,
        ...activityData
      } = data;

      await api.post("/activities", {
        ...activityData,
        type: "TRAINING",
        description: activityNotes || undefined,
        distance: isPlannedMode
          ? 0
          : activityData.distance,
        duration: isPlannedMode
          ? 0
          : totalDuration,
        elevationGain: isPlannedMode
          ? 0
          : activityData.elevationGain,
        calories: isPlannedMode
          ? 0
          : activityData.calories,
      });

      reset();
      setHours(0);
      setMinutes(0);

      window.alert(
        isPlannedMode
          ? "Séance ajoutée au calendrier."
          : "Activité enregistrée.",
      );

      router.push(safeReturnTo);
    } catch (error) {
      console.error(error);
      setSubmitError(
        "Impossible d’enregistrer cette activité pour le moment. Vérifiez les informations puis réessayez.",
      );
    }
  }

  function updateMode(mode: ActivityMode) {
    setSubmitError(null);
    setActivityMode(mode);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles.formRoot}
      noValidate
    >
      <input type="hidden" {...register("status")} />
      <input type="hidden" {...register("returnTo")} />

      <div className={styles.formLayout}>
        <div className={styles.formCard}>
          <FormSection
            eyebrow="Étape 1"
            title="Quel type d’activité ajoutez-vous ?"
            description="Distinguez une sortie terminée d’une séance à venir."
            icon={<Route aria-hidden="true" />}
          >
            <div className={styles.modeGrid}>
              {modeOptions.map((mode) => {
                const Icon = mode.icon;
                const isSelected =
                  activityMode === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    data-selected={isSelected}
                    aria-pressed={isSelected}
                    onClick={() =>
                      updateMode(mode.value)
                    }
                    className={styles.modeCard}
                  >
                    <span className={styles.modeIcon}>
                      <Icon aria-hidden="true" />
                    </span>

                    <span className={styles.modeCopy}>
                      <strong>{mode.label}</strong>
                      <small>{mode.description}</small>
                    </span>

                    <span
                      className={styles.selectionIndicator}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </FormSection>

          <FormSection
            eyebrow="Étape 2"
            title="Choisissez votre discipline"
            description="Le sport sélectionné adapte la lecture de vos futures statistiques."
            icon={<Mountain aria-hidden="true" />}
          >
            <SportSelector
              value={selectedSport}
              onChange={(value: ActivitySportValue) =>
                setValue("sport", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </FormSection>

          <FormSection
            eyebrow="Étape 3"
            title="Informations essentielles"
            description={
              isPlannedMode
                ? "Donnez un nom et un créneau à votre prochaine sortie."
                : "Identifiez clairement la séance déjà réalisée."
            }
            icon={<CalendarDays aria-hidden="true" />}
          >
            <div className={styles.twoColumnGrid}>
              <MetricsInput
                label="Titre"
                type="text"
                placeholder={
                  isPlannedMode
                    ? "Ex. Sortie longue du dimanche"
                    : "Ex. Trail du Semnoz"
                }
                error={errors.title?.message}
                {...register("title")}
              />

              <MetricsInput
                label="Date et heure"
                type="datetime-local"
                error={errors.startedAt?.message}
                {...register("startedAt")}
              />
            </div>
          </FormSection>

          {!isPlannedMode ? (
            <FormSection
              eyebrow="Étape 4"
              title="Résultats de la sortie"
              description="Renseignez les métriques utiles à votre progression."
              icon={<Gauge aria-hidden="true" />}
            >
              <div className={styles.performanceGrid}>
                <MetricsInput
                  label="Distance"
                  unit="km"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  error={errors.distance?.message}
                  {...register("distance", {
                    valueAsNumber: true,
                  })}
                />

                <div className={styles.durationField}>
                  <div className={styles.durationHeader}>
                    <label>Durée</label>
                    <span>
                      <Clock3 aria-hidden="true" />
                      {formatDuration(hours, minutes)}
                    </span>
                  </div>

                  <div className={styles.durationGrid}>
                    <label className={styles.durationInput}>
                      <span>Heures</span>
                      <div>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          aria-label="Durée en heures"
                          value={hours}
                          onChange={(event) =>
                            setHours(
                              Math.max(
                                0,
                                toSafeInteger(
                                  event.target.value,
                                ),
                              ),
                            )
                          }
                        />
                        <i>h</i>
                      </div>
                    </label>

                    <label className={styles.durationInput}>
                      <span>Minutes</span>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          inputMode="numeric"
                          aria-label="Durée en minutes"
                          value={minutes}
                          onChange={(event) =>
                            setMinutes(
                              Math.min(
                                59,
                                Math.max(
                                  0,
                                  toSafeInteger(
                                    event.target.value,
                                  ),
                                ),
                              ),
                            )
                          }
                        />
                        <i>min</i>
                      </div>
                    </label>
                  </div>

                  {errors.duration ? (
                    <p className={styles.fieldError}>
                      {errors.duration.message}
                    </p>
                  ) : null}
                </div>

                <MetricsInput
                  label="Dénivelé positif"
                  unit="m"
                  type="number"
                  min="0"
                  placeholder="0"
                  hint="Particulièrement utile pour le trail, la randonnée et le VTT."
                  error={errors.elevationGain?.message}
                  {...register("elevationGain", {
                    valueAsNumber: true,
                  })}
                />

                <MetricsInput
                  label="Calories"
                  unit="kcal"
                  type="number"
                  min="0"
                  placeholder="0"
                  error={errors.calories?.message}
                  {...register("calories", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </FormSection>
          ) : (
            <div className={styles.plannedNotice}>
              <span>
                <CalendarPlus aria-hidden="true" />
              </span>
              <div>
                <strong>Les résultats viendront après la sortie</strong>
                <p>
                  La séance sera ajoutée au calendrier sans distance,
                  durée, dénivelé ni calories. Vous pourrez compléter
                  ces données une fois l’activité réalisée.
                </p>
              </div>
            </div>
          )}

          <FormSection
            eyebrow={isPlannedMode ? "Étape 4" : "Étape 5"}
            title="Carnet de séance"
            description="Ajoutez le contexte qui donnera du sens aux chiffres."
            icon={<NotebookPen aria-hidden="true" />}
          >
            <div className={styles.notesField}>
              <label htmlFor="activity-notes">
                Notes et sensations
              </label>
              <textarea
                id="activity-notes"
                rows={5}
                placeholder="Terrain, météo, ressenti, points forts, difficulté rencontrée..."
                aria-invalid={Boolean(errors.notes)}
                {...register("notes")}
              />
              <div className={styles.notesMeta}>
                <span>
                  <MapPin aria-hidden="true" />
                  Décrivez le terrain ou le lieu dans vos notes.
                </span>
                <span>
                  {notes?.length ?? 0} caractère
                  {(notes?.length ?? 0) > 1 ? "s" : ""}
                </span>
              </div>

              {errors.notes ? (
                <p className={styles.fieldError}>
                  {errors.notes.message}
                </p>
              ) : null}
            </div>
          </FormSection>

          {submitError ? (
            <div className={styles.submitError} role="alert">
              {submitError}
            </div>
          ) : null}

          <div className={styles.formActions}>
            <Link
              href={safeReturnTo}
              className={styles.cancelButton}
            >
              Annuler
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className={styles.spinner}
                    aria-hidden="true"
                  />
                  Enregistrement...
                </>
              ) : isPlannedMode ? (
                <>
                  <CalendarPlus aria-hidden="true" />
                  Ajouter au calendrier
                </>
              ) : (
                <>
                  <CheckCircle2 aria-hidden="true" />
                  Enregistrer l’activité
                </>
              )}
            </Button>
          </div>
        </div>

        <aside className={styles.summaryColumn}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.summarySportIcon}>
                <SportIcon aria-hidden="true" />
              </span>

              <div>
                <p>Aperçu de la séance</p>
                <h2>
                  {title?.trim() ||
                    (isPlannedMode
                      ? "Votre prochaine aventure"
                      : "Nouvelle activité")}
                </h2>
              </div>
            </div>

            <div className={styles.summaryRows}>
              {summary.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label}>
                    <span>
                      <Icon aria-hidden="true" />
                      {item.label}
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                );
              })}
            </div>

            {!isPlannedMode ? (
              <div className={styles.summaryMetrics}>
                <div>
                  <span>Distance</span>
                  <strong>
                    {formatMetric(distance, "km")}
                  </strong>
                </div>
                <div>
                  <span>Dénivelé</span>
                  <strong>
                    {formatMetric(elevationGain, "m")}
                  </strong>
                </div>
                <div>
                  <span>Calories</span>
                  <strong>
                    {formatMetric(calories, "kcal")}
                  </strong>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.trackingCard}>
            <div className={styles.trackingHeader}>
              <span>
                <Sparkles aria-hidden="true" />
              </span>
              <div>
                <p>Smart tracking</p>
                <h2>Des données propres, des conseils plus utiles.</h2>
              </div>
            </div>

            <ul>
              <li>
                <Mountain aria-hidden="true" />
                <span>
                  <strong>Dénivelé</strong>
                  Indispensable pour analyser le trail et la montagne.
                </span>
              </li>
              <li>
                <Clock3 aria-hidden="true" />
                <span>
                  <strong>Durée précise</strong>
                  Permet de suivre votre volume d’entraînement réel.
                </span>
              </li>
              <li>
                <Dumbbell aria-hidden="true" />
                <span>
                  <strong>Ressenti</strong>
                  Relie la performance aux sensations de la séance.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}
