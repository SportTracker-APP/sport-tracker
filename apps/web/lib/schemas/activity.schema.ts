import { z } from "zod";

export const createActivitySchema = z.object({
  sport: z.string().min(1),

  status: z.enum(["PLANNED", "COMPLETED"]).optional(),

  title: z
    .string()
    .min(2, "Le titre est trop court")
    .max(80, "Le titre est trop long"),

  distance: z.number().min(0, "La distance ne peut pas être négative"),

  duration: z.number().min(0, "La durée ne peut pas être négative"),

  elevationGain: z.number().min(0, "Le dénivelé ne peut pas être négatif"),

  calories: z.number().min(0, "Les calories ne peuvent pas être négatives"),

  startedAt: z.string(),

  returnTo: z.string().optional(),

  notes: z.string().max(500, "Maximum 500 caractères").optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
