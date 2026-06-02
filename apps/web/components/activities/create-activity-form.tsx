"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
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

      title: "",

      distance: 0,

      duration: 0,

      elevationGain: 0,

      calories: 0,

      startedAt: new Date().toISOString().slice(0, 16),

      notes: "",
    },
  });

  const selectedSport = watch("sport");

  const [hours, setHours] = useState(0);

  const [minutes, setMinutes] = useState(0);

  const totalDuration = hours * 60 + minutes;

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

  async function onSubmit(data: CreateActivityInput) {
    try {
      const { notes, ...activityData } = data;

      await api.post("/activities", {
        ...activityData,
        type: "TRAINING",
        description: notes || undefined,
        duration: totalDuration,
      });

      reset();

      setHours(0);

      setMinutes(0);

      alert("Activité créée 🚀");

      router.push("/activites");
    } catch (error) {
      console.error(error);

      alert("Erreur création activité");
    }
  }

  return (
    <div className="rounded-[32px] border border-white/[0.08] bg-[#181922]/90 p-8 backdrop-blur-xl">
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">
          Ajouter une activité
        </h2>

        <p className="mt-2 text-zinc-400">
          Enregistrez une activité sportive passée ou planifiée.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* SPORT */}
        <div className="mb-8">
          <SportSelector
            value={selectedSport}
            onChange={(value) =>
              setValue("sport", value as CreateActivityInput["sport"])
            }
          />
        </div>

        {/* SECTION */}
        <div className="space-y-8">
          {/* INFORMATIONS */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Informations</h3>

              <p className="mt-1 text-sm text-zinc-500">
                Informations générales de l’activité.
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

          {/* PERFORMANCE */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Performance</h3>

              <p className="mt-1 text-sm text-zinc-500">
                Métriques de la séance.
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

          {/* NOTES */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Notes</h3>

              <p className="mt-1 text-sm text-zinc-500">
                Ressenti, météo, sensations, terrain...
              </p>
            </div>

            <div>
              <textarea
                rows={5}
                placeholder="Ajoutez des notes sur votre activité..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white transition outline-none placeholder:text-zinc-500 focus:border-violet-500"
                {...register("notes")}
              />

              {errors.notes && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <div className="mt-10">
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
            ) : (
              "Créer l’activité"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
