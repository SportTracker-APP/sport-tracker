"use client";

import { useSearchParams } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";

import { CreateActivityForm } from "@/components/activities/create-activity-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import styles from "./new-activity-page.module.css";

export default function NewActivityPage() {
  const searchParams = useSearchParams();
  const isPlanning = searchParams.get("status") !== "COMPLETED";

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroPhoto} />
          <div className={styles.heroOverlay} />

          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <div className={styles.heroKicker}>
                {isPlanning ? (
                  <CalendarDays aria-hidden="true" />
                ) : (
                  <Plus aria-hidden="true" />
                )}
                {isPlanning
                  ? "Planifier une sortie"
                  : "Ajouter une sortie passée"}
              </div>

              <h1>
                {isPlanning ? (
                  <>
                    Planifie ta prochaine <span>sortie.</span>
                  </>
                ) : (
                  <>
                    Ajoute une sortie déjà <span>réalisée.</span>
                  </>
                )}
              </h1>

              <p>
                {isPlanning
                  ? "Choisis le terrain, le créneau et l’intention. Ta prochaine aventure trouvera naturellement sa place dans le planning."
                  : "Consigne l’essentiel de ta sortie pour enrichir tes traces, tes sommets et les pages de ton carnet."}
              </p>
            </div>
          </div>
        </div>

        <CreateActivityForm />
      </div>
    </DashboardLayout>
  );
}
