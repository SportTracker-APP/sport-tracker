"use client";

import { useState } from "react";

import Link from "next/link";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";

import { forgotPassword } from "@/lib/auth";

import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from "@/lib/schemas/auth.schema";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const showEmailError = Boolean(errors.email && isSubmitted);

  async function onSubmit(data: ForgotPasswordSchema) {
    try {
      setServerError(null);
      setConfirmationMessage(null);

      const response = await forgotPassword(data.email);

      setConfirmationMessage(response.message);
    } catch {
      setServerError("Impossible de traiter la demande pour le moment.");
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
          Mot de passe oublié
        </h2>

        <p className="text-zinc-400">
          Reçois un lien sécurisé pour reprendre ton aventure.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-zinc-300">Email</label>

          <div className="relative">
            <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

            <Input
              type="email"
              placeholder="ton@email.com"
              autoComplete="email"
              className="h-12 border-white/10 bg-black/30 pl-12 text-white placeholder:text-zinc-500"
              {...register("email")}
            />
          </div>

          {showEmailError && (
            <p className="text-sm text-red-400">{errors.email?.message}</p>
          )}
        </div>

        {serverError && (
          <div className="app-auth-alert app-auth-alert-error">
            {serverError}
          </div>
        )}

        {confirmationMessage && (
          <div className="app-auth-alert app-auth-alert-success">
            {confirmationMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-violet-500 text-base font-medium text-white transition-all hover:bg-violet-400"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </span>
          ) : (
            "Recevoir le lien"
          )}
        </Button>

        <p className="pt-4 text-center text-sm text-zinc-500">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-violet-400 transition hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
