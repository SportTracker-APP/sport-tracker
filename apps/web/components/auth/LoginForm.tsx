"use client";

import { useState } from "react";

import Link from "next/link";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Eye, EyeOff, Loader2, ShieldCheck, Mail, Lock } from "lucide-react";

import { z } from "zod";

import { login } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),

  password: z.string().min(6, "Minimum 6 caractères"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export function LoginForm() {
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted, touchedFields },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),

    mode: "onBlur",

    reValidateMode: "onBlur",

    defaultValues: {
      email: "",
      password: "",
    },
  });
  const showEmailError = Boolean(
    errors.email && (touchedFields.email || isSubmitted),
  );
  const showPasswordError = Boolean(
    errors.password && (touchedFields.password || isSubmitted),
  );

  async function onSubmit(data: LoginSchema) {
    try {
      setServerError(null);

      const response = await login(data.email, data.password);

      setAuth(response.accessToken, response.user);

      window.location.href = "/";
    } catch (error: any) {
      console.log(error);

      setServerError(
        error?.response?.data?.message || "Email ou mot de passe invalide",
      );
    }
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
          Prêt à repartir ?
        </h2>

        <p className="text-zinc-400">
          Retrouve tes sorties, sommets et explorations.
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {...register("email")}
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

        {/* FORGOT PASSWORD */}
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-zinc-500 transition hover:text-violet-400"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* SERVER ERROR */}
        {serverError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
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
    </div>
  );
}
