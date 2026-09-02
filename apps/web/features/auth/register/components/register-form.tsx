"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPasswordStrength } from "@/components/auth/password-strength";
import { GoogleAuthSection } from "@/components/auth/google-auth-section";
import { registerUser } from "@/lib/auth";
import { registerSchema, RegisterSchema } from "@/lib/schemas/auth.schema";

import { BrandMark } from "../../login/components/login-hero";
import { LoginStatusMessage } from "../../login/components/login-status-message";
import styles from "../../login/login.module.css";

function getRegisterErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Une erreur est survenue. Réessaie dans un instant.";
  }

  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message;

  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(" ");
  }

  if (typeof message === "string") {
    return message;
  }

  return "Une erreur est survenue. Réessaie dans un instant.";
}

function getPasswordStrengthClass(color: string): string {
  if (color === "bg-green-500") {
    return styles.strengthStrong;
  }

  if (color === "bg-yellow-500") {
    return styles.strengthMedium;
  }

  return styles.strengthWeak;
}

export function RegisterForm() {
  const registerCardRef = useRef<HTMLDivElement | null>(null);
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
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
    },
  });

  const password = useWatch({ control, name: "password" }) || "";
  const showFirstNameError = Boolean(errors.firstName && isSubmitted);
  const showEmailError = Boolean(errors.email && isSubmitted);
  const showPasswordError = Boolean(errors.password && isSubmitted);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );
  const passwordRequirements = useMemo(
    () => [
      {
        label: "8 caractères minimum",
        isValid: password.length >= 8,
      },
      {
        label: "Au moins une lettre",
        isValid: /[A-Za-z]/.test(password),
      },
      {
        label: "Au moins un chiffre",
        isValid: /\d/.test(password),
      },
    ],
    [password],
  );

  useEffect(() => {
    const card = registerCardRef.current;

    if (!card) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const supportsHover = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 901px)",
    );

    if (prefersReducedMotion.matches || !supportsHover.matches) {
      return;
    }

    let animationFrame: number | null = null;

    const resetTilt = () => {
      card.style.setProperty("--login-tilt-x", "0deg");
      card.style.setProperty("--login-tilt-y", "0deg");
      card.style.setProperty("--login-hover-y", "0px");
      card.style.setProperty("--login-parallax-x", "0px");
      card.style.setProperty("--login-parallax-y", "0px");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const horizontalRatio = (event.clientX - rect.left) / rect.width - 0.5;
        const verticalRatio = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.setProperty(
          "--login-tilt-x",
          `${(-verticalRatio * 3.2).toFixed(2)}deg`,
        );
        card.style.setProperty(
          "--login-tilt-y",
          `${(horizontalRatio * 3.2).toFixed(2)}deg`,
        );
        card.style.setProperty("--login-hover-y", "-3px");
        card.style.setProperty(
          "--login-parallax-x",
          `${(horizontalRatio * 7).toFixed(2)}px`,
        );
        card.style.setProperty(
          "--login-parallax-y",
          `${(verticalRatio * 5).toFixed(2)}px`,
        );
      });
    };

    const handlePointerLeave = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      resetTilt();
    };

    card.addEventListener("pointermove", handlePointerMove);
    card.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      card.removeEventListener("pointermove", handlePointerMove);
      card.removeEventListener("pointerleave", handlePointerLeave);
      resetTilt();
    };
  }, []);

  async function onSubmit(data: RegisterSchema) {
    try {
      setServerError(null);
      setConfirmationMessage(null);

      const response = await registerUser(
        data.firstName,
        data.email,
        data.password,
      );

      setConfirmationEmail(data.email);
      setConfirmationMessage(response.message);
    } catch (error: unknown) {
      setServerError(getRegisterErrorMessage(error));
    }
  }

  if (confirmationEmail) {
    return (
      <div ref={registerCardRef} className={styles.loginCard}>
        <div className={styles.mobileBrand}>
          <BrandMark />
          <span>
            HOVREN<span>.fr</span>
          </span>
        </div>

        <div className={styles.formHeader}>
          <span className={styles.formEyebrow}>Activation du carnet</span>
          <h2>Vérifie ta boîte mail</h2>
          <p>Nous avons envoyé un lien d’activation à {confirmationEmail}.</p>
        </div>

        {confirmationMessage && (
          <LoginStatusMessage tone="success">
            {confirmationMessage}
          </LoginStatusMessage>
        )}

        <p className={styles.helperText}>
          Une fois l’adresse validée, ton carnet s’ouvrira automatiquement.
        </p>

        <p className={styles.formFooter}>
          Déjà validé ? <Link href="/login">Se connecter</Link>
        </p>
      </div>
    );
  }

  return (
    <div ref={registerCardRef} className={styles.loginCard}>
      <div className={styles.mobileBrand}>
        <BrandMark />
        <span>
          HOVREN<span>.fr</span>
        </span>
      </div>

      <div className={styles.formHeader}>
        <span className={styles.formEyebrow}>Ton futur refuge</span>
        <h2>Crée ton carnet</h2>
        <p>Commence ton carnet de sommets et prépare tes premières traces.</p>
      </div>

      <GoogleAuthSection mode="register" />

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
      >
        <div className={styles.fieldGroup}>
          <label htmlFor="register-first-name">Prénom</label>
          <div className={styles.inputWrap}>
            <User aria-hidden="true" />
            <Input
              id="register-first-name"
              type="text"
              placeholder="Ton prénom"
              autoComplete="given-name"
              className={`${styles.input} ${
                showFirstNameError ? styles.inputInvalid : ""
              }`}
              {...formRegister("firstName")}
            />
          </div>
          {showFirstNameError && (
            <p className={styles.fieldError}>{errors.firstName?.message}</p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="register-email">Email</label>
          <div className={styles.inputWrap}>
            <Mail aria-hidden="true" />
            <Input
              id="register-email"
              type="email"
              placeholder="ton@email.com"
              autoComplete="email"
              className={`${styles.input} ${
                showEmailError ? styles.inputInvalid : ""
              }`}
              {...formRegister("email")}
            />
          </div>
          {showEmailError && (
            <p className={styles.fieldError}>{errors.email?.message}</p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="register-password">Mot de passe</label>
          <div className={styles.inputWrap}>
            <Lock aria-hidden="true" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              className={`${styles.input} ${styles.passwordInput} ${
                showPasswordError ? styles.inputInvalid : ""
              }`}
              {...formRegister("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </button>
          </div>
          {showPasswordError && (
            <p className={styles.fieldError}>{errors.password?.message}</p>
          )}
        </div>

        {password.length > 0 && (
          <div className={styles.passwordPanel}>
            <div className={styles.strengthTrack}>
              <div
                className={`${styles.strengthValue} ${getPasswordStrengthClass(
                  passwordStrength.color,
                )}`}
                style={{ width: passwordStrength.width }}
              />
            </div>

            <p className={styles.strengthLabel}>
              Sécurité : <span>{passwordStrength.label}</span>
            </p>

            <ul className={styles.requirements}>
              {passwordRequirements.map((requirement) => (
                <li
                  key={requirement.label}
                  className={
                    requirement.isValid
                      ? styles.requirementValid
                      : styles.requirement
                  }
                >
                  <CheckCircle2 aria-hidden="true" />
                  <span>{requirement.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {serverError && (
          <LoginStatusMessage tone="error">{serverError}</LoginStatusMessage>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <span>
              <Loader2 aria-hidden="true" className={styles.spinner} />
              Création...
            </span>
          ) : (
            "Créer mon compte"
          )}
        </Button>

        <p className={styles.formFooter}>
          Déjà un carnet ? <Link href="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
