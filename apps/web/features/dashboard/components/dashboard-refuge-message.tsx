import { Activity, Compass, Quote } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { RefugeMessage } from "../refuge-messages";
import { formatDayCount } from "../utils/date-format";
import { ForestLineIllustration } from "./dashboard-illustrations";

export function DashboardRefugeMessage({
  refugeMessage,
  daysSinceLastActivity,
}: {
  refugeMessage: RefugeMessage;
  daysSinceLastActivity: number | null;
}) {
  return (
    <div className={styles.messagePanelWrap}>
      <FadeIn delay={0.58}>
        <div className={`${styles.surface} ${styles.messagePanel}`}>
          <Quote className={styles.quoteIcon} aria-hidden="true" />
          <div className={styles.messageContent}>
            <div className={styles.messageTopline}>
              <span className={styles.messageEyebrow}>
                <Compass aria-hidden="true" /> Humeur du refuge
              </span>
            </div>

            <div className={styles.messageBody}>
              <h2>Message du refuge</h2>
              <strong>{refugeMessage.title}</strong>
              <p>{refugeMessage.body}</p>
            </div>

            <div className={styles.messageMeta}>
              <Activity aria-hidden="true" />
              {daysSinceLastActivity === null
                ? "Aucune sortie récente"
                : daysSinceLastActivity === 0
                  ? "Dernière sortie aujourd’hui"
                  : `Dernière sortie il y a ${formatDayCount(daysSinceLastActivity)}`}
            </div>
          </div>
          <ForestLineIllustration className={styles.forestIllustration} />
        </div>
      </FadeIn>
    </div>
  );
}
