import type { ReactNode } from "react";

/**
 * Layout shell for future filter controls (search, status, date range).
 * No filtering logic lives here — it's a place to put those controls
 * consistently once a module has real data to filter.
 */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="filter-bar">
      {children}
    </div>
  );
}
