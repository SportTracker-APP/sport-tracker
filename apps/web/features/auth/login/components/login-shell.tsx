import styles from "../login.module.css";

type LoginShellProps = {
  hero: React.ReactNode;
  form: React.ReactNode;
};

export function LoginShell({ hero, form }: LoginShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.paperNoise} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.bookFold} aria-hidden="true" />
        <svg
          className={styles.connectorTrail}
          viewBox="0 0 1000 680"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M284 582C342 546 414 560 474 524C536 486 566 436 622 382C662 344 692 260 715 188"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="6 12"
          />
        </svg>
        {hero}
        <section className={styles.formPanel} aria-label="Connexion HOVREN">
          <div className={styles.formPanelInner}>{form}</div>
        </section>
      </div>
    </main>
  );
}
