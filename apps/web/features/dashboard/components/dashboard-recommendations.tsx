import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

import styles from "../dashboard.module.css";
import type { RecommendationDefinition } from "../types";

export function DashboardRecommendations({
  recommendations,
}: {
  recommendations: RecommendationDefinition[];
}) {
  return (
    <div className={styles.recommendationsWrap}>
      <FadeIn delay={0.64}>
        <div className={`${styles.surface} ${styles.recommendations}`}>
          <h2>À surveiller & recommandations</h2>
          <div className={styles.recommendationGrid}>
            {recommendations.map((recommendation) => {
              const Icon = recommendation.icon;

              return (
                <Link
                  href={recommendation.href}
                  key={recommendation.title}
                  className={styles.recommendationItem}
                >
                  <div className={styles.recommendationIcon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <div className={styles.recommendationContent}>
                    <strong>{recommendation.title}</strong>
                    <p>{recommendation.description}</p>
                    <span
                      className={
                        recommendation.tone === "warning"
                          ? styles.recommendationWarning
                          : styles.recommendationSuccess
                      }
                    >
                      {recommendation.label}
                    </span>
                  </div>
                  <ChevronRight aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
