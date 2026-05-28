"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";

import { MetricsInput } from "./metrics-input";

import { SportSelector } from "./sport-selector";

export function CreateActivityForm() {
  const [sport, setSport] =
    useState("TRAIL");

  const [title, setTitle] =
    useState("");

  const [distance, setDistance] =
    useState("");

  const [duration, setDuration] =
    useState("");

  const [elevationGain, setElevationGain] =
    useState("");

  const [calories, setCalories] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit() {
    try {
      setIsLoading(true);

      await api.post(
        "/activities",
        {
          sport,

          title,

          distance:
            Number(distance),

          duration:
            Number(duration),

          elevationGain:
            Number(
              elevationGain,
            ),

          calories:
            Number(calories),

          startedAt:
            new Date().toISOString(),
        },
      );

      // RESET
      setTitle("");

      setDistance("");

      setDuration("");

      setElevationGain("");

      setCalories("");

      alert(
        "Activité créée 🚀",
      );

    } catch (error) {
      console.error(error);

      alert(
        "Erreur création activité",
      );
    } finally {
      setIsLoading(false);
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
          Enregistrez votre entraînement.
        </p>
      </div>

      {/* SPORT */}
      <div className="mb-8">
        <SportSelector
          value={sport}
          onChange={setSport}
        />
      </div>

      {/* FORM */}
      <div className="grid gap-6 md:grid-cols-2">

        <MetricsInput
          label="Titre"
          type="text"
          value={title}
          onChange={setTitle}
        />

        <MetricsInput
          label="Distance"
          unit="km"
          value={distance}
          onChange={setDistance}
        />

        <MetricsInput
          label="Durée"
          unit="min"
          value={duration}
          onChange={setDuration}
        />

        <MetricsInput
          label="Dénivelé"
          unit="m"
          value={elevationGain}
          onChange={
            setElevationGain
          }
        />

        <MetricsInput
          label="Calories"
          unit="kcal"
          value={calories}
          onChange={setCalories}
        />
      </div>

      {/* BUTTON */}
      <div className="mt-8">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="h-12 rounded-2xl bg-violet-500 px-8 hover:bg-violet-400"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            "Créer l’activité"
          )}
        </Button>
      </div>
    </div>
  );
}