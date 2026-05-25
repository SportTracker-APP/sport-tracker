import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, "Minimum 2 caractères")
    .max(30, "Maximum 30 caractères"),

  email: z
    .string()
    .email("Email invalide"),

  password: z
    .string()
    .min(6, "Minimum 6 caractères"),
});

export type RegisterSchema =
  z.infer<typeof registerSchema>;