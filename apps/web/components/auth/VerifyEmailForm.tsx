"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { verifyEmail } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    const verificationToken = token;
    let isMounted = true;

    async function verify() {
      try {
        const response = await verifyEmail(verificationToken);

        if (!isMounted) {
          return;
        }

        setAuth(response.accessToken, response.user);
        setStatus("success");
        window.setTimeout(() => router.replace("/refuge"), 900);
      } catch (error: unknown) {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    void verify();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, setAuth]);

  return (
    <div className="app-auth-card rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
            {status === "error" ? (
              <ShieldAlert className="h-6 w-6 text-white" />
            ) : status === "success" ? (
              <CheckCircle2 className="h-6 w-6 text-white" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            )}
          </div>
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-white">
          {status === "error"
            ? "Lien invalide"
            : status === "success"
              ? "Email vérifié"
              : "Vérification..."}
        </h2>

        <p className="text-zinc-400">
          {status === "error"
            ? "Ce lien est expiré ou a déjà été utilisé."
            : status === "success"
              ? "Ton compte est activé. Redirection en cours."
              : "Nous activons ton compte."}
        </p>
      </div>

      {status === "error" && (
        <div className="space-y-5">
          <div className="app-auth-alert app-auth-alert-error">
            Impossible de vérifier cette adresse email.
          </div>

          <p className="text-center text-sm text-zinc-500">
            <Link
              href="/login"
              className="text-violet-400 transition hover:text-violet-300"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
