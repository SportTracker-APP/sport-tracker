"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";


import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

import { registerUser } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

import {
  registerSchema,
  RegisterSchema,
} from "@/lib/schemas/auth.schema";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

function getPasswordStrength(password: string) {
  if (password.length < 6) {
    return {
      label: "Faible",
      width: "33%",
      color: "bg-red-500",
    };
  }

  if (password.length < 10) {
    return {
      label: "Moyen",
      width: "66%",
      color: "bg-yellow-500",
    };
  }

  return {
    label: "Fort",
    width: "100%",
    color: "bg-green-500",
  };
}

export function RegisterForm() {
  const router = useRouter();

  const setAuth = useAuthStore(
  (state) => state.setAuth,
);

  const [showPassword, setShowPassword] =
    useState(false);

  const [serverError, setServerError] =
    useState<string | null>(null);

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: {
      errors,
      isSubmitting,
      isValid,
    },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password") || "";

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

 async function onSubmit(data: RegisterSchema) {
  console.log("SUBMIT OK");

  console.log(data);

  try {
    setServerError(null);

    const response = await registerUser(
      data.email,
      data.password,
    );

    console.log(response);

    setAuth(
      response.accessToken,
      response.user,
    );

    router.push("/");
  } catch (error: any) {
    console.log(error);

    setServerError(
      error?.response?.data?.message ||
        "Une erreur est survenue",
    );
  }
}

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-white">
          Créer un compte
        </h2>

        <p className="text-zinc-400">
          Commence gratuitement dès aujourd’hui.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* EMAIL */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-300">
            Email
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

            <Input
              type="email"
              placeholder="ton@email.com"
              autoComplete="email"
              autoFocus
              className="h-12 border-white/10 bg-black/30 pl-12 text-white placeholder:text-zinc-500"
              {...formRegister("email")}
            />
          </div>

          {errors.email && (
            <p className="text-sm text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">
              Mot de passe
            </label>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
                className="h-12 border-white/10 bg-black/30 pl-12 pr-12 text-white placeholder:text-zinc-500"
                {...formRegister("password")}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-red-400">
                {errors.password.message}
              </p>
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
                <span className="text-white">
                  {passwordStrength.label}
                </span>
              </p>
            </div>
          )}
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
          disabled={!isValid || isSubmitting}
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