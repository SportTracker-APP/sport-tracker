"use client";

import { useState } from "react";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/features/auth/login/components/login-hero";
import { LoginStatusMessage } from "@/features/auth/login/components/login-status-message";
import styles from "@/features/auth/login/login.module.css";
import { forgotPassword } from "@/lib/auth";
import {
  ForgotPasswordSchema,
  forgotPasswordSchema,
} from "@/lib/schemas/auth.schema";

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
    defaultValues: { email: "" },
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
    <section className={styles.loginCard}>
      <div className={styles.mobileBrand}>
        <BrandMark />
        <span>
          HOVREN<span>.fr</span>
        </span>
      </div>

      <div className={styles.formHeader}>
        <span className={styles.formEyebrow}>Accès sécurisé</span>
        <h2>Retrouve ton accès</h2>
        <p>Reçois un lien sécurisé pour rouvrir ton carnet de sommets.</p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
      >
        <div className={styles.fieldGroup}>
          <label htmlFor="forgot-password-email">Email</label>
          <div className={styles.inputWrap}>
            <Mail aria-hidden="true" />
            <input
              id="forgot-password-email"
              type="email"
              placeholder="ton@email.com"
              autoComplete="email"
              className={`${styles.input} ${showEmailError ? styles.inputInvalid : ""}`}
              {...register("email")}
            />
          </div>
          {showEmailError && (
            <p className={styles.fieldError}>{errors.email?.message}</p>
          )}
        </div>

        {serverError && (
          <LoginStatusMessage tone="error">{serverError}</LoginStatusMessage>
        )}
        {confirmationMessage && (
          <LoginStatusMessage tone="success">
            {confirmationMessage}
          </LoginStatusMessage>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <span>
              <Loader2 className={styles.spinner} aria-hidden="true" />
              Envoi en cours
            </span>
          ) : (
            "Recevoir le lien"
          )}
        </Button>

        <Link href="/login" className={styles.backButton}>
          <ArrowLeft aria-hidden="true" />
          Retour à la connexion
        </Link>
      </form>
    </section>
  );
}
