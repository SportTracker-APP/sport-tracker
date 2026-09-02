"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, Map, Route } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

import styles from "./welcome.module.css";

const steps = [
  {
    number: "01",
    icon: Route,
    title: "Connecte Strava",
    description:
      "Importe tes sorties pour faire apparaître automatiquement tes traces et tes découvertes.",
    label: "Connecter Strava",
    href: "/integrations/strava",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Découvre tes sommets",
    description:
      "Retrouve les sommets déjà révélés par tes sorties et ceux qu’il te reste à atteindre.",
    label: "Voir les sommets",
    href: "/sommets",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isCompleting, setIsCompleting] = useState(false);

  async function completeJourney(destination: string) {
    setIsCompleting(true);
    try {
      await api.put("/users/me/onboarding/welcome");
      if (user) {
        setUser({ ...user, needsWelcomeOnboarding: false });
      }
    } catch (error) {
      // The destination remains usable if the API is temporarily unavailable.
      console.warn("Welcome onboarding completion could not be saved.", error);
    } finally {
      setIsCompleting(false);
      router.push(destination);
    }
  }

  return (
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Première page du carnet</p>
            <h1>Bienvenue dans HOVREN.</h1>
            <p>
              Trois repères suffisent pour commencer. Tu pourras toujours revenir
              sur chacun d’eux depuis ton refuge.
            </p>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <svg viewBox="0 0 620 230" fill="none">
              <defs>
                <linearGradient
                  id="welcome-mountain-fade"
                  x1="310"
                  y1="12"
                  x2="310"
                  y2="224"
                >
                  <stop stopColor="#879486" stopOpacity=".3" />
                  <stop
                    offset="1"
                    stopColor="#a8b19f"
                    stopOpacity=".025"
                  />
                </linearGradient>
              </defs>
              <path
                d="M20 220 108 172l42 20 88-112 36 49 58-77 53 73 46-47 58 75 42-31 70 98H20Z"
                fill="url(#welcome-mountain-fade)"
              />
              <path
                d="m238 80 36 49 58-77 53 73 46-47 58 75"
                stroke="#667468"
                strokeOpacity=".14"
              />
              <path
                className={styles.mountainRoute}
                d="M150 192 238 80 274 129 332 52"
                stroke="#c85b2f"
                strokeWidth="2.5"
                strokeDasharray="5 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="150" cy="192" r="4" fill="#c85b2f" />
              <circle cx="238" cy="80" r="3.25" fill="#c85b2f" />
              <circle cx="332" cy="52" r="3.5" fill="#c85b2f" />
              <path
                className={styles.summitFlag}
                d="M332 52V18m0 0 16 7-16 7"
                stroke="#2f5d46"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M100 173v-22m-9 22 9-22 10 22m9 1v-30m-12 30 12-30 13 30"
                stroke="#667468"
                strokeOpacity=".22"
              />
            </svg>
            <span>Ton terrain commence ici</span>
          </div>
        </header>

        <section className={styles.journey} aria-label="Parcours de bienvenue">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article className={styles.step} key={step.number}>
                <span className={styles.number}>Étape {step.number}</span>
                <Icon aria-hidden="true" />
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
                <Link href={step.href} className={styles.secondaryAction}>
                  {step.label} <ArrowRight aria-hidden="true" />
                </Link>
              </article>
            );
          })}

          <article className={`${styles.step} ${styles.finalStep}`}>
            <span className={styles.number}>Étape 03</span>
            <Map aria-hidden="true" />
            <div>
              <h2>Explore la carte</h2>
              <p>
                Visualise tes traces, les sommets proches et ton terrain
                d’aventure sur la carte HOVREN.
              </p>
            </div>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={isCompleting}
              onClick={() => void completeJourney("/carte")}
            >
              {isCompleting ? "Ouverture…" : "Explorer la carte"}
              <ArrowRight aria-hidden="true" />
            </button>
          </article>
        </section>

        <button
          type="button"
          className={styles.skipAction}
          disabled={isCompleting}
          onClick={() => void completeJourney("/refuge")}
        >
          Entrer directement dans mon refuge
        </button>
      </main>
    </DashboardLayout>
  );
}
