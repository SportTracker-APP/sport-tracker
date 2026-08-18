"use client";

import styles from "./summit-scope-switch.module.css";

export type SummitCatalogScope = "MINE" | "ALL";

export function SummitScopeSwitch({
  value,
  disabled = false,
  onChange,
}: {
  value: SummitCatalogScope;
  disabled?: boolean;
  onChange: (value: SummitCatalogScope) => void;
}) {
  return (
    <div className={styles.switch} aria-label="Périmètre des sommets">
      <button
        type="button"
        aria-pressed={value === "MINE"}
        disabled={disabled}
        onClick={() => onChange("MINE")}
      >
        Mes territoires
      </button>
      <button
        type="button"
        aria-pressed={value === "ALL"}
        onClick={() => onChange("ALL")}
      >
        Tous les sommets
      </button>
    </div>
  );
}
