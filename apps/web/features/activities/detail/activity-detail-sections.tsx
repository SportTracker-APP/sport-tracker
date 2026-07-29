import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  HeartPulse,
  Mountain,
  Sparkles,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import type { Activity } from "@/lib/activities";

import { ActivityElevationChart } from "./activity-elevation-chart";
import {
  formatActivityDate,
  formatNumber,
  type ElevationData,
} from "./activity-detail-utils";
import type {
  ActivityFieldRow,
  ActivityMetric,
} from "./activity-detail-view-model";
import styles from "./activity-detail.module.css";

export function ActivityDetailLoading() {
  return (
    <DashboardLayout variant="refuge">
      <div className={styles.loadingPage} aria-label="Chargement de la sortie">
        <div className={styles.loadingLine} />
        <div className={styles.loadingCover} />
        <div className={styles.loadingMetrics} />
        <div className={styles.loadingSection} />
      </div>
    </DashboardLayout>
  );
}

export function ActivityDetailError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <DashboardLayout variant="refuge">
      <section className={styles.errorState}>
        <span className={styles.eyebrow}>Carnet d’expédition</span>
        <h1>Cette sortie reste introuvable.</h1>
        <p>
          Elle a peut-être été supprimée ou n’est plus accessible depuis ce
          carnet.
        </p>
        <div className={styles.errorActions}>
          <button type="button" onClick={onRetry}>
            Réessayer
          </button>
          <Link href="/activites">Retour aux sorties</Link>
        </div>
      </section>
    </DashboardLayout>
  );
}

export function ActivityQuickStats({
  metrics,
}: {
  metrics: ActivityMetric[];
}) {
  return (
    <section className={styles.metrics} aria-label="Lecture rapide">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div key={metric.label} className={styles.metric}>
            <Icon aria-hidden="true" />
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function ActivityAnalysis({
  activity,
  elevation,
  fieldRows,
}: {
  activity: Activity;
  elevation: ElevationData | null;
  fieldRows: ActivityFieldRow[];
}) {
  return (
    <section className={styles.analysis}>
      <div className={styles.elevationSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Lecture du relief</span>
            <h2>Le profil de cette aventure.</h2>
            {elevation ? (
              <span className={styles.elevationSource}>
                {elevation.source === "strava"
                  ? "Données d’altitude Strava"
                  : "Profil reconstitué"}
              </span>
            ) : null}
          </div>
          {elevation ? (
            <div
              className={styles.elevationSummary}
              aria-label="Synthèse du dénivelé"
            >
              <span>
                <strong>{formatNumber(elevation.minimum)} m</strong>
                point bas
              </span>
              <span>
                <strong>{formatNumber(elevation.maximum)} m</strong>
                point haut
              </span>
              <span>
                <strong>+{formatNumber(elevation.ascent)} m</strong>
                D+
              </span>
              <span>
                <strong>
                  {elevation.descent === null
                    ? "—"
                    : `-${formatNumber(elevation.descent)} m`}
                </strong>
                D-
              </span>
            </div>
          ) : null}
        </div>
        {elevation ? (
          <>
            <ActivityElevationChart points={elevation.points} />
            <p className={styles.elevationCaption}>
              {elevation.source === "strava"
                ? "Profil issu de la série d’altitude enregistrée par Strava."
                : "Profil reconstitué à partir du tracé GPS et des repères d’altitude de la sortie. Le D− reste vide lorsqu’il ne peut pas être établi fidèlement."}
            </p>
          </>
        ) : (
          <div className={styles.elevationEmpty}>
            <Mountain aria-hidden="true" />
            <div>
              <strong>Profil d’altitude indisponible</strong>
              <p>
                Strava n’a pas fourni de série point par point exploitable pour
                cette trace. Les repères enregistrés restent disponibles.
              </p>
              <div className={styles.elevationKnownData}>
                {activity.elevationGain !== null ? (
                  <span>
                    <b>+{formatNumber(activity.elevationGain)} m</b>
                    Dénivelé positif
                  </span>
                ) : null}
                {activity.maxAltitude !== null ? (
                  <span>
                    <b>{formatNumber(activity.maxAltitude)} m</b>
                    Point culminant
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className={styles.fieldSheet}>
        <span className={styles.eyebrow}>Fiche de terrain</span>
        <h2>Les repères de la sortie.</h2>
        <dl>
          {fieldRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

export function ActivityJournal({ activity }: { activity: Activity }) {
  return (
    <section className={styles.journal}>
      <div className={styles.journalHeading}>
        <span className={styles.eyebrow}>Journal de la sortie</span>
        <h2>Ce que cette trace laisse dans ton carnet.</h2>
      </div>
      <div className={styles.journalBody}>
        {activity.description?.trim() ? (
          <p>{activity.description}</p>
        ) : (
          <div className={styles.journalEmpty}>
            <Sparkles aria-hidden="true" />
            <p>
              Aucun souvenir écrit pour cette sortie. La trace, le relief et les
              repères restent conservés dans ton carnet.
            </p>
          </div>
        )}
        <div className={styles.journalMeta}>
          <span>
            <Clock3 aria-hidden="true" />
            Ajoutée le {formatActivityDate(activity.createdAt).full}
          </span>
          {activity.averageHeartRate !== null ? (
            <span>
              <HeartPulse aria-hidden="true" />
              {Math.round(activity.averageHeartRate)} bpm de moyenne
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ActivityFooterActions() {
  return (
    <footer className={styles.finalActions}>
      <div>
        <span className={styles.eyebrow}>Une sortie. Une trace. Un souvenir.</span>
        <h2>Continue à faire vivre ton carnet.</h2>
      </div>
      <div>
        <Link href="/activites">
          Toutes mes sorties
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/statistiques" className={styles.secondaryLink}>
          Statistiques détaillées
          <ExternalLink aria-hidden="true" />
        </Link>
      </div>
    </footer>
  );
}
