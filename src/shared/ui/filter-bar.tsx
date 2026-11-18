import type { ReactNode } from "react";

/**
 * Layout shell for future filter controls (search, status, date range).
 * No filtering logic lives here — it's a place to put those controls
 * consistently once a module has real data to filter.
 */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] bg-white/80 p-3 shadow-[var(--sh-sm)] backdrop-blur-sm">
      {children}
    </div>
  );
}
