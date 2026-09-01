"use client";

import { useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword, login } from "@/lib/auth";
import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from "@/lib/schemas/auth.schema";
import { useAuthStore } from "@/store/auth-store";

import { BrandMark } from "./login-hero";
import { LoginStatusMessage } from "./login-status-message";
import { loginSchema, LoginSchema } from "../login.schema";
import styles from "../login.module.css";

type AuthCardMode = "login" | "forgot-password";

export function LoginForm() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const loginCardRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const card = loginCardRef.current;

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

  async function onLoginSubmit(data: LoginSchema) {
    try {
      setServerError(null);

      const response = await login(data.email, data.password);

      setAuth(response.accessToken, response.user);

      router.replace("/refuge");
      router.refresh();
    } catch {
      setServerError("Email ou mot de passe invalide");
    }
  }

  async function onForgotPasswordSubmit(data: ForgotPasswordSchema) {
    try {
      setForgotPasswordError(null);
      setForgotPasswordConfirmation(null);

      const response = await forgotPassword(data.email);

      setForgotPasswordConfirmation(response.message);
    } catch {
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
    <div ref={loginCardRef} className={styles.loginCard}>
      <div className={styles.mobileBrand}>
        <BrandMark />
        <span>
          HOVREN<span>.fr</span>
        </span>
      </div>

      <div className={styles.formHeader}>
        <span className={styles.formEyebrow}>Ton espace HOVREN</span>
        <h2>{mode === "login" ? "Ouvre ton carnet" : "Retrouve ton accès"}</h2>
        <p>
          {mode === "login"
            ? "Connecte-toi pour retrouver tes sorties, tes sommets et ta progression."
            : "Renseigne ton email pour recevoir un lien sécurisé."}
        </p>
      </div>

      {mode === "login" ? (
        <form
          noValidate
          onSubmit={handleLoginSubmit(onLoginSubmit)}
          className={styles.form}
        >
          <div className={styles.fieldGroup}>
            <label htmlFor="login-email">Email</label>
            <div className={styles.inputWrap}>
              <Mail aria-hidden="true" />
              <Input
                id="login-email"
                type="email"
                placeholder="ton@email.com"
                autoComplete="email"
                className={`${styles.input} ${
                  showEmailError ? styles.inputInvalid : ""
                }`}
                {...registerLogin("email")}
              />
            </div>
            {showEmailError && (
              <p className={styles.fieldError}>{errors.email?.message}</p>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="login-password">Mot de passe</label>
            <div className={styles.inputWrap}>
              <Lock aria-hidden="true" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Ton mot de passe"
                autoComplete="current-password"
                className={`${styles.input} ${styles.passwordInput} ${
                  showPasswordError ? styles.inputInvalid : ""
                }`}
                {...registerLogin("password")}
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

          <div className={styles.formUtility}>
            <button type="button" onClick={openForgotPassword}>
              Mot de passe oublié ?
            </button>
          </div>

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
                Ouverture...
              </span>
            ) : (
              "Ouvrir mon carnet"
            )}
          </Button>

          <p className={styles.formFooter}>
            Pas encore de carnet ?{" "}
            <Link href="/register">Créer mon compte</Link>
          </p>
        </form>
      ) : (
        <form
          noValidate
          onSubmit={handleForgotPasswordSubmit(onForgotPasswordSubmit)}
          className={styles.form}
        >
          <div className={styles.fieldGroup}>
            <label htmlFor="forgot-email">Email</label>
            <div className={styles.inputWrap}>
              <Mail aria-hidden="true" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="ton@email.com"
                autoComplete="email"
                className={`${styles.input} ${
                  showForgotPasswordEmailError ? styles.inputInvalid : ""
                }`}
                {...registerForgotPassword("email")}
              />
            </div>
            {showForgotPasswordEmailError && (
              <p className={styles.fieldError}>
                {forgotPasswordErrors.email?.message}
              </p>
            )}
          </div>

          {forgotPasswordError && (
            <LoginStatusMessage tone="error">
              {forgotPasswordError}
            </LoginStatusMessage>
          )}

          {forgotPasswordConfirmation && (
            <LoginStatusMessage tone="success">
              {forgotPasswordConfirmation}
            </LoginStatusMessage>
          )}

          <Button
            type="submit"
            disabled={isForgotPasswordSubmitting}
            className={styles.submitButton}
          >
            {isForgotPasswordSubmitting ? (
              <span>
                <Loader2 aria-hidden="true" className={styles.spinner} />
                Envoi...
              </span>
            ) : (
              "Recevoir le lien"
            )}
          </Button>

          <p className={styles.formFooter}>
            <button
              type="button"
              onClick={openLogin}
              className={styles.backButton}
            >
              <ArrowLeft aria-hidden="true" />
              Retour à la connexion
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
