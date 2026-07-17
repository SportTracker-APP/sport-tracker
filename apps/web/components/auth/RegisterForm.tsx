"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { registerUser } from "@/lib/auth";

import { registerSchema, RegisterSchema } from "@/lib/schemas/auth.schema";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { getPasswordStrength } from "./password-strength";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null,
  );

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const password = watch("password") || "";
  const showFirstNameError = Boolean(errors.firstName && isSubmitted);
  const showEmailError = Boolean(errors.email && isSubmitted);
  const showPasswordError = Boolean(errors.password && isSubmitted);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  async function onSubmit(data: RegisterSchema) {
    try {
      setServerError(null);

      const response = await registerUser(
        data.firstName,
        data.email,
        data.password,
      );

      setConfirmationEmail(data.email);
      setConfirmationMessage(response.message);
    } catch (error: unknown) {
      setServerError("Une erreur est survenue");
    }
  }

  if (confirmationEmail) {
    return (
      <div className="app-auth-card rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 space-y-3 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-white">
            Vérifie ta boîte mail
          </h2>

          <p className="text-zinc-400">
            Nous avons envoyé un lien d’activation à {confirmationEmail}.
          </p>
        </div>

        {confirmationMessage && (
          <div className="app-auth-alert app-auth-alert-success">
            {confirmationMessage}
          </div>
        )}

        <p className="pt-6 text-center text-sm text-zinc-500">
          Une fois l’adresse validée, vous serez connecté automatiquement.
        </p>

        <p className="pt-4 text-center text-sm text-zinc-500">
          Déjà validé ?{" "}
          <Link
            href="/login"
            className="text-violet-400 transition hover:text-violet-300"
          >
            Se connecter
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="app-auth-card rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-white">
          Créer un compte
        </h2>

        <p className="text-zinc-400">Commence gratuitement dès aujourd'hui.</p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* FIRST NAME */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-300">Prénom</label>

          <div className="relative">
            <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

            <Input
              type="text"
              placeholder="Ton prénom"
              autoComplete="given-name"
              className="h-12 border-white/10 bg-black/30 pl-12 text-white placeholder:text-zinc-500"
              {...formRegister("firstName")}
            />
          </div>

          {showFirstNameError && (
            <p className="text-sm text-red-400">{errors.firstName?.message}</p>
          )}
        </div>
        {/* EMAIL */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-300">Email</label>

          <div className="relative">
            <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

            <Input
              type="email"
              placeholder="ton@email.com"
              autoComplete="email"
              className="h-12 border-white/10 bg-black/30 pl-12 text-white placeholder:text-zinc-500"
              {...formRegister("email")}
            />
          </div>

          {showEmailError && (
            <p className="text-sm text-red-400">{errors.email?.message}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Mot de passe</label>

            <div className="relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
                className="h-12 border-white/10 bg-black/30 pr-12 pl-12 text-white placeholder:text-zinc-500"
                {...formRegister("password")}
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

        {/* SERVER ERROR */}
        {serverError && (
          <div className="app-auth-alert app-auth-alert-error">
            {serverError}
          </div>
        )}

        {/* BUTTON */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-violet-500 text-base font-medium text-white transition-all hover:bg-violet-400"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Création...
            </span>
          ) : (
            "Créer mon compte"
          )}
        </Button>

        {/* FOOTER */}
        <p className="pt-4 text-center text-sm text-zinc-500">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="text-violet-400 transition hover:text-violet-300"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
