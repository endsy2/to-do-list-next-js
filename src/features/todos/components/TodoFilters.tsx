"use client";

import type { TodoCounts, TodoFilter } from "@/features/todos/hooks/useTodos";

type TodoFiltersProps = {
  filter: TodoFilter;
  counts: TodoCounts;
  onChange: (filter: TodoFilter) => void;
};

const FILTERS: ReadonlyArray<{ value: TodoFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export function TodoFilters({ filter, counts, onChange }: TodoFiltersProps) {
  const countFor = (value: TodoFilter) =>
    value === "active"
      ? counts.active
      : value === "completed"
        ? counts.completed
        : counts.total;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-black/60 dark:text-white/60">
        {counts.active} {counts.active === 1 ? "item" : "items"} left
      </p>

      <div role="group" aria-label="Filter todos" className="flex gap-1">
        {FILTERS.map(({ value, label }) => {
          const isActive = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-pressed={isActive}
              className={`rounded-md px-2.5 py-1 transition ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
              }`}
            >
              {label}
              <span className="ml-1.5 tabular-nums opacity-60">
                {countFor(value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
