"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { BrandMark } from "@/features/auth/login/components/login-hero";
import { verifyEmail } from "@/lib/auth";

import { useAuthStore } from "@/store/auth-store";

import styles from "@/features/auth/login/login.module.css";

type VerificationStatus = "loading" | "success" | "error";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const displayedStatus = token ? status : "error";

  useEffect(() => {
    if (!token) {
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
        window.setTimeout(() => router.replace("/bienvenue"), 900);
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    void verify();

    return () => {
      isMounted = false;
    };
  }, [router, setAuth, token]);

  return <VerificationPanel status={displayedStatus} />;
}

export function VerifyEmailPending() {
  return <VerificationPanel status="loading" />;
}

function VerificationPanel({ status }: { status: VerificationStatus }) {
  const isError = status === "error";
  const isSuccess = status === "success";

  return (
    <section
      className={`${styles.loginCard} ${styles.verificationCard}`}
      aria-live="polite"
      aria-busy={status === "loading"}
    >
      <div className={styles.mobileBrand}>
        <BrandMark />
        <span>
          HOVREN<span>.fr</span>
        </span>
      </div>

      <div
        className={`${styles.verificationSeal} ${
          isError
            ? styles.verificationSealError
            : isSuccess
              ? styles.verificationSealSuccess
              : styles.verificationSealLoading
        }`}
        aria-hidden="true"
      >
        {isError ? <ShieldAlert /> : isSuccess ? <CheckCircle2 /> : <Loader2 />}
      </div>

      <div className={`${styles.formHeader} ${styles.verificationHeader}`}>
        <span className={styles.formEyebrow}>
          {isError
            ? "Validation interrompue"
            : isSuccess
              ? "Carnet activé"
              : "Dernière étape"}
        </span>
        <h2>
          {isError
            ? "Lien invalide"
            : isSuccess
              ? "Email vérifié"
              : "Ouverture du carnet"}
        </h2>
        <p>
          {isError
            ? "Ce lien est expiré ou a déjà été utilisé."
            : isSuccess
              ? "Ton compte est activé. Redirection en cours."
              : "Nous sécurisons ton accès et activons ton carnet."}
        </p>
      </div>

      {status === "loading" && (
        <div className={styles.verificationProgress} aria-hidden="true">
          <span />
        </div>
      )}

      {isSuccess && (
        <div
          className={`${styles.statusMessage} ${styles.statusSuccess} ${styles.verificationMessage}`}
        >
          Ton histoire outdoor peut commencer.
        </div>
      )}

      {isError && (
        <div className={styles.verificationActions}>
          <div
            className={`${styles.statusMessage} ${styles.statusError} ${styles.verificationMessage}`}
          >
            Impossible de vérifier cette adresse email.
          </div>

          <Link href="/login" className={styles.verificationLink}>
            Retour à la connexion
          </Link>
        </div>
      )}
    </section>
  );
}
