"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";

import { resetPassword } from "@/lib/auth";

import {
  resetPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/schemas/auth.schema";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { getPasswordStrength } from "./password-strength";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password") || "";
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );
  const showPasswordError = Boolean(errors.password && isSubmitted);
  const showConfirmPasswordError = Boolean(
    errors.confirmPassword && isSubmitted,
  );

  async function onSubmit(data: ResetPasswordSchema) {
    if (!token) {
      setServerError("Lien invalide ou expiré.");
      return;
    }

    try {
      setServerError(null);
      setSuccessMessage(null);

      const response = await resetPassword(
        token,
        data.password,
        data.confirmPassword,
      );

      setSuccessMessage(response.message);
      window.setTimeout(() => router.push("/login"), 1200);
    } catch (error: unknown) {
      setServerError("Lien invalide, expiré ou déjà utilisé.");
    }
  }

  return (
    <div className="app-auth-card rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-white">
          Nouveau mot de passe
        </h2>

        <p className="text-zinc-400">
          Choisis un mot de passe solide pour sécuriser ton compte.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">
              Nouveau mot de passe
            </label>

            <div className="relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                className="h-12 border-white/10 bg-black/30 pr-12 pl-12 text-white placeholder:text-zinc-500"
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500 transition hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {showPasswordError && (
              <p className="text-sm text-red-400">{errors.password?.message}</p>
            )}
          </div>

          {password.length > 0 && (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{
                    width: passwordStrength.width,
                  }}
                />
              </div>

              <p className="text-xs text-zinc-400">
                Sécurité :{" "}
                <span className="text-white">{passwordStrength.label}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-300">
            Confirmer le mot de passe
          </label>

          <div className="relative">
            <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirme ton mot de passe"
              autoComplete="new-password"
              className="h-12 border-white/10 bg-black/30 pl-12 text-white placeholder:text-zinc-500"
              {...register("confirmPassword")}
            />
          </div>

          {showConfirmPasswordError && (
            <p className="text-sm text-red-400">
              {errors.confirmPassword?.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className="app-auth-alert app-auth-alert-error">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="app-auth-alert app-auth-alert-success">
            {successMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !token}
          className="h-12 w-full rounded-xl bg-violet-500 text-base font-medium text-white transition-all hover:bg-violet-400"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mise à jour...
            </span>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>

        <p className="pt-4 text-center text-sm text-zinc-500">
          <Link
            href="/login"
            className="text-violet-400 transition hover:text-violet-300"
          >
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
