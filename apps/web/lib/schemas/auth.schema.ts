import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, "Minimum 2 caractères")
    .max(30, "Maximum 30 caractères"),

  email: z.string().email("Email invalide"),

  password: z.string().min(6, "Minimum 6 caractères"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Ajoute au moins une lettre et un chiffre",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
