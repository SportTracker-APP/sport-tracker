import type { ActivityMonthGroup } from "../activities-types";
import styles from "../activities.module.css";
import { ActivityJournalEntry } from "./activity-journal-entry";

export function ActivityJournal({ groups }: { groups: ActivityMonthGroup[] }) {
  return (
    <section className={styles.journal} aria-labelledby="journal-title">
      <div className={styles.journalHeading}>
        <div>
          <p>Journal chronologique</p>
          <h2 id="journal-title">Les pages déjà écrites.</h2>
        </div>
        <p>Chaque trace garde sa date, son relief et son souvenir.</p>
      </div>

      {groups.map((group) => (
        <section
          key={group.key}
          className={styles.monthGroup}
          aria-labelledby={`month-${group.key}`}
        >
          <header>
            <h3 id={`month-${group.key}`}>{group.label}</h3>
            <span>
              {group.activities.length} sortie
              {group.activities.length > 1 ? "s" : ""}
            </span>
          </header>
          <div className={styles.monthEntries}>
            {group.activities.map((activity) => (
              <ActivityJournalEntry key={activity.id} activity={activity} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
