"use client";

import {
  ACTIVITY_SPORTS,
  type ActivitySportValue,
} from "./activity-form.constants";
import styles from "./create-activity-form.module.css";

type SportSelectorProps = {
  value: string;
  onChange: (value: ActivitySportValue) => void;
};

export function SportSelector({
  value,
  onChange,
}: SportSelectorProps) {
  return (
    <div
      className={styles.sportGrid}
      role="radiogroup"
      aria-label="Choisir un sport"
    >
      {ACTIVITY_SPORTS.map((sport) => {
        const Icon = sport.icon;
        const isSelected = value === sport.value;

        return (
          <button
            key={sport.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-selected={isSelected}
            onClick={() => onChange(sport.value)}
            className={styles.sportCard}
          >
            <span className={styles.sportIcon}>
              <Icon aria-hidden="true" />
            </span>

            <span className={styles.sportCopy}>
              <strong>{sport.label}</strong>
              <small>{sport.description}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
