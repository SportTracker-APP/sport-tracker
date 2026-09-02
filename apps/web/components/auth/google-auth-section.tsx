import { getGoogleAuthorizationUrl } from "@/lib/auth";

import styles from "@/features/auth/login/login.module.css";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.googleIcon}
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.03v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.38 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.31-1.93V7.45H3.03A10 10 0 0 0 2 12c0 1.64.39 3.2 1.03 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.97 5.45l3.35 2.62C7.17 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export function GoogleAuthSection({
  isCompleting = false,
  mode,
}: {
  isCompleting?: boolean;
  mode: "login" | "register";
}) {
  const label =
    mode === "login"
      ? "Se connecter avec Google"
      : "Créer un compte avec Google";

  return (
    <div className={styles.googleAuthSection}>
      {isCompleting ? (
        <span className={`${styles.googleButton} ${styles.googleButtonBusy}`}>
          <GoogleIcon />
          Connexion avec Google…
        </span>
      ) : (
        <a
          className={styles.googleButton}
          href={getGoogleAuthorizationUrl()}
        >
          <GoogleIcon />
          {label}
        </a>
      )}

      <div className={styles.authSeparator} aria-hidden="true">
        <span />
        <small>ou avec ton email</small>
        <span />
      </div>
    </div>
  );
}
