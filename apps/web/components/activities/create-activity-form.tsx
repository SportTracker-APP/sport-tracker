"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

import {
  createActivitySchema,
  type CreateActivityInput,
} from "@/lib/schemas/activity.schema";

import { Button } from "@/components/ui/button";

import { MetricsInput } from "./metrics-input";

import { SportSelector } from "./sport-selector";

export function CreateActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plannedDate = searchParams.get("date");
  const requestedStatus = searchParams.get("status");
  const returnTo = searchParams.get("returnTo");
  const isPlannedActivity = requestedStatus === "PLANNED";
  const defaultStartedAt = plannedDate
    ? `${plannedDate}T12:00`
    : new Date().toISOString().slice(0, 16);
  const [activityMode, setActivityMode] = useState<"COMPLETED" | "PLANNED">(
    isPlannedActivity ? "PLANNED" : "COMPLETED",
  );

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

      status: isPlannedActivity ? "PLANNED" : "COMPLETED",

      title: isPlannedActivity ? "Séance prévue" : "",

      distance: 0,

      duration: 0,

      elevationGain: 0,

      calories: 0,

      startedAt: defaultStartedAt,

      notes: "",

      returnTo: returnTo || undefined,
    },
  });

  const selectedSport = watch("sport");
  const title = watch("title");

  const [hours, setHours] = useState(0);

  const [minutes, setMinutes] = useState(0);

  const totalDuration = hours * 60 + minutes;
  const isPlannedMode = activityMode === "PLANNED";

  const durationPreview =
    totalDuration > 0
      ? `${hours} h ${minutes.toString().padStart(2, "0")}`
      : "Non renseignée";

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

    if (activityMode === "PLANNED" && title.trim().length === 0) {
      setValue("title", "Séance prévue", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [activityMode, setValue, title]);

  async function onSubmit(data: CreateActivityInput) {
    try {
      const { notes, returnTo: _returnTo, ...activityData } = data;

      await api.post("/activities", {
        ...activityData,
        type: "TRAINING",
        description: notes || undefined,
        distance: isPlannedMode ? 0 : activityData.distance,
        duration: isPlannedMode ? 0 : totalDuration,
        elevationGain: isPlannedMode ? 0 : activityData.elevationGain,
        calories: isPlannedMode ? 0 : activityData.calories,
      });

      reset();

      setHours(0);

      setMinutes(0);

      alert(isPlannedMode ? "Séance planifiée 🚀" : "Activité créée 🚀");

      router.push(returnTo || "/activites");
    } catch (error) {
      console.error(error);

      alert("Erreur création activité");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-9">
      <input type="hidden" {...register("status")} />
      <input type="hidden" {...register("returnTo")} />

      <div className="grid gap-3 rounded-[22px] border border-white/[0.08] bg-black/15 p-2 sm:grid-cols-2">
        {[
          {
            label: "Déjà effectuée",
            description: "J’ajoute une séance passée avec ses résultats.",
            value: "COMPLETED" as const,
            icon: CheckCircle2,
          },
          {
            label: "À venir",
            description: "Je planifie une séance dans mon calendrier.",
            value: "PLANNED" as const,
            icon: CalendarPlus,
          },
        ].map((mode) => {
          const Icon = mode.icon;
          const isSelected = activityMode === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => setActivityMode(mode.value)}
              className={`rounded-[18px] border p-4 text-left transition ${
                isSelected
                  ? "border-violet-500/45 bg-violet-500/16 text-white shadow-[0_0_28px_rgba(139,92,246,0.20)]"
                  : "border-white/[0.06] bg-white/[0.025] text-zinc-400 hover:border-white/15 hover:bg-white/[0.045]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    isSelected
                      ? "border-violet-400/30 bg-violet-500/25 text-violet-100"
                      : "border-white/[0.07] bg-black/20 text-zinc-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="text-sm font-semibold">{mode.label}</span>
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>

      <SportSelector
        value={selectedSport}
        onChange={(value) =>
          setValue("sport", value as CreateActivityInput["sport"])
        }
      />

      <div className="border-t border-white/[0.08] pt-7">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Informations</h3>

          <p className="mt-1 text-sm text-zinc-500">
            {isPlannedMode
              ? "Le nom et le créneau prévu pour votre séance."
              : "Le nom et le moment de votre séance."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <MetricsInput
            label="Titre"
            type="text"
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
      </div>

      {!isPlannedMode && (
        <div className="border-t border-white/[0.08] pt-7">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Performance</h3>

            <p className="mt-1 text-sm text-zinc-500">
              Les chiffres clés qui alimenteront votre progression.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <MetricsInput
              label="Distance"
              unit="km"
              type="number"
              step="0.01"
              error={errors.distance?.message}
              {...register("distance", {
                valueAsNumber: true,
              })}
            />

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-zinc-300">
                  Durée
                </label>

                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-violet-300" />
                  {durationPreview}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="group rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-violet-500">
                  <span className="mb-1 block text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Heures
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      aria-label="Durée en heures"
                      value={hours}
                      onChange={(e) =>
                        setHours(Math.max(0, Number(e.target.value)))
                      }
                      className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none"
                    />

                    <span className="text-sm font-semibold text-zinc-500">
                      h
                    </span>
                  </div>
                </label>

                <label className="group rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-violet-500">
                  <span className="mb-1 block text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Minutes
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      inputMode="numeric"
                      aria-label="Durée en minutes"
                      value={minutes}
                      onChange={(e) =>
                        setMinutes(
                          Math.min(59, Math.max(0, Number(e.target.value))),
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none"
                    />

                    <span className="text-sm font-semibold text-zinc-500">
                      min
                    </span>
                  </div>
                </label>
              </div>

              {errors.duration && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <MetricsInput
              label="Dénivelé"
              unit="m"
              type="number"
              error={errors.elevationGain?.message}
              {...register("elevationGain", {
                valueAsNumber: true,
              })}
            />

            <MetricsInput
              label="Calories"
              unit="kcal"
              type="number"
              error={errors.calories?.message}
              {...register("calories", {
                valueAsNumber: true,
              })}
            />
          </div>
        </div>
      )}

      {isPlannedMode && (
        <div className="rounded-[24px] border border-emerald-500/18 bg-emerald-500/[0.055] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/15 text-emerald-200">
              <CalendarPlus className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">
                Séance planifiée
              </h3>

              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Les métriques seront ajoutées après la sortie. Pour l’instant,
                cette séance apparaîtra comme prévue dans le calendrier.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.08] pt-7">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Notes</h3>

          <p className="mt-1 text-sm text-zinc-500">
            Ressenti, météo, sensations, terrain...
          </p>
        </div>

        <textarea
          rows={5}
          placeholder="Ajoutez des notes sur votre activité..."
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white transition outline-none placeholder:text-zinc-500 focus:border-violet-500"
          {...register("notes")}
        />

        {errors.notes && (
          <p className="mt-2 text-sm text-red-400">{errors.notes.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 rounded-2xl bg-violet-500 px-8 hover:bg-violet-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Création...
          </>
        ) : isPlannedMode ? (
          "Planifier la séance"
        ) : (
          "Créer l’activité"
        )}
      </Button>
    </form>
  );
}
