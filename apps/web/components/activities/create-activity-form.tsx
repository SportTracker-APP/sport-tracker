"use client";

import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";

import { Loader2 } from "lucide-react";

import { api } from "@/lib/api";

import {
  createActivitySchema,
  type CreateActivityInput,
} from "@/lib/schemas/activity.schema";

import { Button } from "@/components/ui/button";

import { MetricsInput } from "./metrics-input";

import { SportSelector } from "./sport-selector";

export function CreateActivityForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(
      createActivitySchema,
    ),

    defaultValues: {
      sport: "TRAIL",

      title: "",

      distance: 0,

      duration: 0,

      elevationGain: 0,

      calories: 0,

      startedAt: new Date()
        .toISOString()
        .slice(0, 16),

      notes: "",
    },
  });

  const selectedSport =
    watch("sport");

  async function onSubmit(
    data: CreateActivityInput,
  ) {
    try {
      await api.post(
        "/activities",
        {
          ...data,
        },
      );

      reset();

      alert(
        "Activité créée 🚀",
      );

    } catch (error) {
      console.error(error);

      alert(
        "Erreur création activité",
      );
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
          Enregistrez une activité
          sportive passée ou
          planifiée.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(
          onSubmit,
        )}
      >
        {/* SPORT */}
        <div className="mb-8">
          <SportSelector
            value={selectedSport}
            onChange={(value) =>
              setValue(
                "sport",
                value as CreateActivityInput["sport"],
              )
            }
          />
        </div>

        {/* SECTION */}
        <div className="space-y-8">
          {/* INFORMATIONS */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Informations
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Informations
                générales de
                l’activité.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <MetricsInput
                label="Titre"
                type="text"
                error={
                  errors.title
                    ?.message
                }
                {...register(
                  "title",
                )}
              />

              <MetricsInput
                label="Date et heure"
                type="datetime-local"
                error={
                  errors.startedAt
                    ?.message
                }
                {...register(
                  "startedAt",
                )}
              />
            </div>
          </div>

          {/* PERFORMANCE */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Performance
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Métriques de la
                séance.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <MetricsInput
                label="Distance"
                unit="km"
                type="number"
                step="0.01"
                error={
                  errors.distance
                    ?.message
                }
                {...register(
                  "distance",
                  {
                    valueAsNumber: true,
                  },
                )}
              />

              <MetricsInput
                label="Durée"
                unit="min"
                type="number"
                error={
                  errors.duration
                    ?.message
                }
                {...register(
                  "duration",
                  {
                    valueAsNumber: true,
                  },
                )}
              />

              <MetricsInput
                label="Dénivelé"
                unit="m"
                type="number"
                error={
                  errors.elevationGain
                    ?.message
                }
                {...register(
                  "elevationGain",
                  {
                    valueAsNumber: true,
                  },
                )}
              />

              <MetricsInput
                label="Calories"
                unit="kcal"
                type="number"
                error={
                  errors.calories
                    ?.message
                }
                {...register(
                  "calories",
                  {
                    valueAsNumber: true,
                  },
                )}
              />
            </div>
          </div>

          {/* NOTES */}
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Notes
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Ressenti,
                météo,
                sensations,
                terrain...
              </p>
            </div>

            <div>
              <textarea
                rows={5}
                placeholder="Ajoutez des notes sur votre activité..."
                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/20
                  px-4
                  py-4
                  text-white
                  outline-none
                  transition
                  placeholder:text-zinc-500
                  focus:border-violet-500
                "
                {...register(
                  "notes",
                )}
              />

              {errors.notes && (
                <p className="mt-2 text-sm text-red-400">
                  {
                    errors.notes
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <div className="mt-10">
          <Button
            type="submit"
            disabled={
              isSubmitting
            }
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