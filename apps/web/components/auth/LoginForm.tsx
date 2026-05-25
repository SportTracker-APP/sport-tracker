"use client";

import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { login } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z
    .string()
    .email("Email invalide"),

  password: z
    .string()
    .min(6, "Minimum 6 caractères"),
});

type LoginFormValues = z.infer<
  typeof loginSchema
>;

export function LoginForm() {
  const router = useRouter();

  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(
    values: LoginFormValues,
  ) {
    try {
      setError("");

      setIsLoading(true);

      const response = await login(
        values.email,
        values.password,
      );

      setAuth(
        response.accessToken,
        response.user,
      );

      router.push("/");
    } catch (error) {
      console.error(error);

      setError(
        "Email ou mot de passe invalide",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] shadow-[0_0_60px_rgba(139,92,246,0.15)] backdrop-blur-2xl">
      <CardContent className="space-y-8 p-10">

        {/* HEADER */}
        <div className="space-y-6 text-center">

          {/* ICON */}
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-violet-500/15 shadow-[0_0_50px_rgba(139,92,246,0.35)] ring-1 ring-white/10">
            <ShieldCheck className="h-11 w-11 text-violet-300" />
          </div>

          {/* TITLE */}
          <div className="space-y-3">
            <h2 className="text-5xl font-bold tracking-tight text-white">
              Bon retour
            </h2>

            <p className="text-base leading-relaxed text-zinc-400">
              Connecte-toi pour accéder à ton dashboard.
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >

          {/* EMAIL */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              Adresse email
            </label>

            <Input
              type="email"
              placeholder="vous@email.com"
              className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-base text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-violet-500"
              {...register("email")}
            />

            {errors.email && (
              <p className="text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              Mot de passe
            </label>

            <div className="relative">
              <Input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="••••••••"
                className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 pr-14 text-base text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-violet-500"
                {...register("password")}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword,
                  )
                }
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-red-400">
                {
                  errors.password
                    .message
                }
              </p>
            )}
          </div>

          {/* FORGOT */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-zinc-500 transition hover:text-violet-400"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.01] hover:from-violet-500 hover:via-fuchsia-500 hover:to-purple-500"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        {/* FOOTER */}
        <p className="pt-2 text-center text-sm text-zinc-500">
          Pas encore de compte ?{" "}

          <Link
            href="/register"
            className="font-medium text-violet-400 transition hover:text-violet-300"
          >
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}