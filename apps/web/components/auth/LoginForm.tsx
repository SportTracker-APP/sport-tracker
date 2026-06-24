"use client";

import { useState } from "react";

import Link from "next/link";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { z } from "zod";

import { forgotPassword, login } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from "@/lib/schemas/auth.schema";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),

  password: z.string().min(6, "Minimum 6 caractères"),
});

type LoginSchema = z.infer<typeof loginSchema>;

type AuthCardMode = "login" | "forgot-password";

export function LoginForm() {
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(
    null,
  );
  const [forgotPasswordConfirmation, setForgotPasswordConfirmation] = useState<
    string | null
  >(null);
  const [mode, setMode] = useState<AuthCardMode>("login");

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    getValues: getLoginValues,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),

    mode: "onSubmit",

    reValidateMode: "onChange",

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerForgotPassword,
    handleSubmit: handleForgotPasswordSubmit,
    setValue: setForgotPasswordValue,
    formState: {
      errors: forgotPasswordErrors,
      isSubmitting: isForgotPasswordSubmitting,
      isSubmitted: isForgotPasswordSubmitted,
    },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const showEmailError = Boolean(errors.email && isSubmitted);
  const showPasswordError = Boolean(errors.password && isSubmitted);
  const showForgotPasswordEmailError = Boolean(
    forgotPasswordErrors.email && isForgotPasswordSubmitted,
  );

  async function onLoginSubmit(data: LoginSchema) {
    try {
      setServerError(null);

      const response = await login(data.email, data.password);

      setAuth(response.accessToken, response.user);

      window.location.href = "/";
    } catch (error: unknown) {
      setServerError("Email ou mot de passe invalide");
    }
  }

  async function onForgotPasswordSubmit(data: ForgotPasswordSchema) {
    try {
      setForgotPasswordError(null);
      setForgotPasswordConfirmation(null);

      const response = await forgotPassword(data.email);

      setForgotPasswordConfirmation(response.message);
    } catch (error: unknown) {
      setForgotPasswordError(
        "Impossible de traiter la demande pour le moment.",
      );
    }
  }

  function openForgotPassword() {
    setForgotPasswordError(null);
    setForgotPasswordConfirmation(null);
    setForgotPasswordValue("email", getLoginValues("email"));
    setMode("forgot-password");
  }

  function openLogin() {
    setMode("login");
    setForgotPasswordError(null);
  }

  return (
    <div className="app-auth-card rounded-3xl bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      {/* HEADER */}
      <div className="mb-8 space-y-3 text-center">
        {/* ICON */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-4xl font-bold tracking-tight text-white">
          {mode === "login" ? "Prêt à repartir ?" : "Mot de passe oublié"}
        </h2>

        <p className="text-zinc-400">
          {mode === "login"
            ? "Retrouve tes sorties, sommets et explorations."
            : "Renseigne ton email pour recevoir un lien sécurisé."}
        </p>
      </div>

      {/* FORM */}
      {mode === "login" ? (
        <form
          noValidate
          onSubmit={handleLoginSubmit(onLoginSubmit)}
          className="space-y-5"
        >
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
                {...registerLogin("email")}
              />
            </div>

            {showEmailError && (
              <p className="text-sm text-red-400">{errors.email?.message}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Mot de passe</label>

            <div className="relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Ton mot de passe"
                autoComplete="current-password"
                className="h-12 border-white/10 bg-black/30 pr-12 pl-12 text-white placeholder:text-zinc-500"
                {...registerLogin("password")}
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

          {/* FORGOT PASSWORD */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openForgotPassword}
              className="text-sm text-zinc-500 transition hover:text-violet-400"
            >
              Mot de passe oublié ?
            </button>
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
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </Button>

          {/* FOOTER */}
          <p className="pt-4 text-center text-sm text-zinc-500">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="text-violet-400 transition hover:text-violet-300"
            >
              Créer un compte
            </Link>
          </p>
        </form>
      ) : (
        <form
          noValidate
          onSubmit={handleForgotPasswordSubmit(onForgotPasswordSubmit)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Email</label>

            <div className="relative">
              <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />

              <Input
                type="email"
                placeholder="ton@email.com"
                autoComplete="email"
                className="h-12 border-white/10 bg-black/30 pl-12 text-white placeholder:text-zinc-500"
                {...registerForgotPassword("email")}
              />
            </div>

            {showForgotPasswordEmailError && (
              <p className="text-sm text-red-400">
                {forgotPasswordErrors.email?.message}
              </p>
            )}
          </div>

          {forgotPasswordError && (
            <div className="app-auth-alert app-auth-alert-error">
              {forgotPasswordError}
            </div>
          )}

          {forgotPasswordConfirmation && (
            <div className="app-auth-alert app-auth-alert-success">
              {forgotPasswordConfirmation}
            </div>
          )}

          <Button
            type="submit"
            disabled={isForgotPasswordSubmitting}
            className="h-12 w-full rounded-xl bg-violet-500 text-base font-medium text-white transition-all hover:bg-violet-400"
          >
            {isForgotPasswordSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi...
              </span>
            ) : (
              "Recevoir le lien"
            )}
          </Button>

          <p className="pt-4 text-center text-sm text-zinc-500">
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex items-center gap-2 text-violet-400 transition hover:text-violet-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
