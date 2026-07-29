import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Oswald, Work_Sans } from "next/font/google";

import styles from "./legal-page.module.css";

const displayFont = Oswald({
  subsets: ["latin"],
  variable: "--font-legal-display",
});

const bodyFont = Work_Sans({
  subsets: ["latin"],
  variable: "--font-legal-body",
});

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  documentLabel: string;
  sections: LegalSection[];
};

function BrandMark() {
  return (
    <svg
      className={styles.brandMark}
      viewBox="0 0 48 34"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 30 17 5l8 14 6-10 14 21"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LegalLandscape() {
  return (
    <svg
      className={styles.landscape}
      viewBox="0 0 390 250"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 176 73 104l40 44 63-92 57 74 42-45 111 91v70H4z"
        fill="currentColor"
        opacity=".09"
      />
      <path
        d="m4 206 88-72 53 48 67-47 69 44 45-31 60 58v40H4z"
        fill="currentColor"
        opacity=".12"
      />
      <path
        d="M25 99c48-47 104-52 153-13 42 33 101 34 171-7"
        stroke="currentColor"
        opacity=".22"
      />
      <path
        d="M44 121c45-37 89-35 132 0 43 35 97 38 163 8"
        stroke="currentColor"
        opacity=".16"
      />
      <path
        d="M69 220c34-29 69-48 105-56 45-10 87-36 125-76"
        stroke="#cf572e"
        strokeWidth="2"
        strokeDasharray="4 7"
        opacity=".62"
      />
      <circle cx="299" cy="88" r="5" fill="#cf572e" />
    </svg>
  );
}

export function LegalPage({
  eyebrow,
  title,
  introduction,
  documentLabel,
  sections,
}: LegalPageProps) {
  return (
    <main
      className={`${styles.page} ${displayFont.variable} ${bodyFont.variable} ${bodyFont.className}`}
    >
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/" aria-label="HOVREN - Accueil">
            <BrandMark />
            <span className={styles.brandText}>
              <span>
                HOVREN<em>.fr</em>
              </span>
              <small>Carnet outdoor intelligent</small>
            </span>
          </Link>

          <Link className={styles.backLink} href="/">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.intro}>{introduction}</p>
          </div>
          <LegalLandscape />
        </section>

        <section className={styles.document} aria-label={documentLabel}>
          <div className={styles.documentHeader}>
            <strong>{documentLabel}</strong>
            <span>Dernière mise à jour : 26 juin 2026</span>
          </div>

          <div className={styles.sections}>
            {sections.map((section) => (
              <article className={styles.article} key={section.title}>
                <h2>{section.title}</h2>
                <div className={styles.paragraphs}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <footer className={styles.footer}>
            <span>© 2026 HOVREN · Pensé dans les Alpes françaises.</span>
            <div className={styles.footerLinks}>
              <Link href="/conditions">Conditions</Link>
              <Link href="/confidentialite">Confidentialité</Link>
              <a href="mailto:contact@hovren.fr">Contact</a>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
