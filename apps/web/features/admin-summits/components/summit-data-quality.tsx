import { AlertTriangle, CheckCircle2 } from "lucide-react";

import type { SummitDataQuality as SummitDataQualityValue } from "@/lib/admin-summits";
import styles from "../admin-summits.module.css";

export function SummitDataQuality({
  quality,
}: {
  quality: SummitDataQualityValue;
}) {
  return (
    <section className={styles.qualityCard} aria-labelledby="quality-title">
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIcon} data-success={quality.isComplete}>
          {quality.isComplete ? <CheckCircle2 /> : <AlertTriangle />}
        </span>
        <div>
          <span className={styles.kicker}>Contrôle catalogue</span>
          <h3 id="quality-title">Qualité des données</h3>
        </div>
      </div>

      {quality.isComplete ? (
        <p className={styles.completeMessage}>
          Données essentielles complètes.
        </p>
      ) : (
        <div className={styles.missingData}>
          <strong>
            {quality.missingCount} information
            {quality.missingCount > 1 ? "s" : ""} manquante
            {quality.missingCount > 1 ? "s" : ""}
          </strong>
          <ul>
            {quality.missing.map((issue) => (
              <li key={issue.code}>{issue.label}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
