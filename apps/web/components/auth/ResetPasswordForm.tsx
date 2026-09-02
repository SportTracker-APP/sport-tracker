"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/features/auth/login/components/login-hero";
import { LoginStatusMessage } from "@/features/auth/login/components/login-status-message";
import styles from "@/features/auth/login/login.module.css";
import { resetPassword } from "@/lib/auth";
import {
  ResetPasswordSchema,
  resetPasswordSchema,
} from "@/lib/schemas/auth.schema";

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
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "password" }) || "";
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );
  const strengthClass =
    passwordStrength.label === "Fort"
      ? styles.strengthStrong
      : passwordStrength.label === "Moyen"
        ? styles.strengthMedium
        : styles.strengthWeak;
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
    } catch {
      setServerError("Lien invalide, expiré ou déjà utilisé.");
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
        <h2>Nouveau mot de passe</h2>
        <p>Choisis un mot de passe solide pour protéger ton carnet.</p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
      >
        <div className={styles.fieldGroup}>
          <label htmlFor="reset-password">Nouveau mot de passe</label>
          <div className={styles.inputWrap}>
            <Lock aria-hidden="true" />
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              className={`${styles.input} ${styles.passwordInput} ${showPasswordError ? styles.inputInvalid : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className={styles.passwordToggle}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {showPasswordError && (
            <p className={styles.fieldError}>{errors.password?.message}</p>
          )}
        </div>

        {password.length > 0 && (
          <div className={styles.passwordPanel}>
            <div className={styles.strengthTrack} aria-hidden="true">
              <div
                className={`${styles.strengthValue} ${strengthClass}`}
                style={{ width: passwordStrength.width }}
              />
            </div>
            <p className={styles.strengthLabel}>
              Sécurité : <span>{passwordStrength.label}</span>
            </p>
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="reset-password-confirmation">
            Confirmer le mot de passe
          </label>
          <div className={styles.inputWrap}>
            <Lock aria-hidden="true" />
            <input
              id="reset-password-confirmation"
              type={showPassword ? "text" : "password"}
              placeholder="Confirme ton mot de passe"
              autoComplete="new-password"
              className={`${styles.input} ${showConfirmPasswordError ? styles.inputInvalid : ""}`}
              {...register("confirmPassword")}
            />
          </div>
          {showConfirmPasswordError && (
            <p className={styles.fieldError}>
              {errors.confirmPassword?.message}
            </p>
          )}
        </div>

        {serverError && (
          <LoginStatusMessage tone="error">{serverError}</LoginStatusMessage>
        )}
        {successMessage && (
          <LoginStatusMessage tone="success">
            {successMessage}
          </LoginStatusMessage>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !token}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <span>
              <Loader2 className={styles.spinner} aria-hidden="true" />
              Mise à jour
            </span>
          ) : (
            "Réinitialiser le mot de passe"
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
