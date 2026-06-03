"use client";

type ActivityFiltersProps = {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

const filters = [
  "Tous",
  "Course",
  "Cyclisme",
  "VTT",
  "Trail",
  "Musculation",
  "Randonnée",
];

export function ActivityFilters({
  activeFilter,
  onFilterChange,
}: ActivityFiltersProps) {
  return (
    <div className="app-activity-filters flex flex-wrap gap-3">
      {filters.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            data-active={isActive}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "border-white bg-white text-black"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
            } `}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
