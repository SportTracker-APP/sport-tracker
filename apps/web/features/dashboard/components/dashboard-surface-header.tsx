import type { ReactNode } from "react";

import styles from "../dashboard.module.css";

export function SurfaceHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.surfaceHeader}>
      <div>
        <h2 className={styles.surfaceTitle}>{title}</h2>
        <p className={styles.surfaceDescription}>{description}</p>
      </div>
      {action}
    </div>
  );
}
