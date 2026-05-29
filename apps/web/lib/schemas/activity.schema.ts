import { z } from "zod";

export const createActivitySchema =
  z.object({
    sport: z.string().min(1),

    title: z
      .string()
      .min(
        2,
        "Le titre est trop court",
      )
      .max(
        80,
        "Le titre est trop long",
      ),

    distance: z
      .number()
      .positive(
        "La distance doit être positive",
      ),

    duration: z
      .number()
      .positive(
        "La durée doit être positive",
      ),

    elevationGain: z
      .number()
      .min(
        0,
        "Le dénivelé ne peut pas être négatif",
      ),

    calories: z
      .number()
      .min(
        0,
        "Les calories ne peuvent pas être négatives",
      ),

    startedAt: z.string(),

    notes: z
      .string()
      .max(
        500,
        "Maximum 500 caractères",
      )
      .optional(),
  });

export type CreateActivityInput =
  z.infer<
    typeof createActivitySchema
  >;