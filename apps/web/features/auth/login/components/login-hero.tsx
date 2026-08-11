import Link from "next/link";
import { BookOpen, MapPinned, Mountain } from "lucide-react";

import { XSocialLink } from "@/features/landing/components/x-social-link";

import styles from "../login.module.css";

export function LoginHero() {
  return (
    <section className={styles.heroPanel} aria-label="Univers HOVREN">
      <div className={styles.heroPhoto} aria-hidden="true" />
      <div className={styles.heroScrim} aria-hidden="true" />
      <div className={styles.topoLines} aria-hidden="true" />

      <div className={styles.heroContent}>
        <Link className={styles.brand} href="/" aria-label="HOVREN - Accueil">
          <BrandMark />
          <span className={styles.brandText}>
            <span>
              HOVREN<span className={styles.domain}>.fr</span>
            </span>
            <small>Le carnet des sommets</small>
          </span>
        </Link>

        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <span className={styles.waymark} />
            Le carnet des sommets
          </span>
          <h1>Retrouve ton carnet de sommets</h1>
          <p>Tes sorties, tes sommets et tes souvenirs t&apos;attendent.</p>
        </div>

        <p className={styles.origin}>
          <Mountain aria-hidden="true" />
          Pensé dans les Alpes françaises.
        </p>

        <div className={styles.memoryCard} aria-hidden="true">
          <div className={styles.memoryCardHeader}>
            <span>Dernière trace</span>
            <span className={styles.memoryBadge}>Sommet validé</span>
          </div>
          <div className={styles.memoryRoute}>
            <svg viewBox="0 0 280 90" fill="none">
              <polyline
                className={styles.memoryFill}
                points="0,90 0,68 34,56 62,44 96,53 126,30 158,42 192,20 224,47 258,38 280,56 280,90"
              />
              <polyline
                className={styles.memoryPath}
                points="0,68 34,56 62,44 96,53 126,30 158,42 192,20 224,47 258,38 280,56"
              />
              <circle className={styles.memoryPeak} cx="192" cy="20" r="4" />
            </svg>
          </div>
          <div className={styles.memoryStats}>
            <span>
              <Mountain aria-hidden="true" />
              Mont Veyrier
            </span>
            <span>
              <MapPinned aria-hidden="true" />
              Annecy
            </span>
            <span>
              <BookOpen aria-hidden="true" />
              Carnet vivant
            </span>
          </div>
        </div>
      </div>

      <div className={styles.heroFooter}>
        <span>© 2026 HOVREN</span>
        <div>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions">Conditions</Link>
          <XSocialLink className={styles.socialLink} />
        </div>
      </div>
    </section>
  );
}

export function BrandMark() {
  return (
    <svg
      className={styles.brandMark}
      width="34"
      height="28"
      viewBox="0 0 32 26"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 24L11 5L15 13L19 3L31 24"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
