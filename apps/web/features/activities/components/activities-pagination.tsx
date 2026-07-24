import { ChevronLeft, ChevronRight } from "lucide-react";

import styles from "../activities.module.css";

export function ActivitiesPagination({
  currentPage,
  totalPages,
  firstVisible,
  lastVisible,
  totalCount,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  firstVisible: number;
  lastVisible: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Pagination des sorties">
      <p>
        {firstVisible} à {lastVisible} sur {totalCount} sorties
      </p>
      <div>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <span aria-current="page">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Page suivante"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
