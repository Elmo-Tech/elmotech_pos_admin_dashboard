import type { ReactNode } from "react";

export function DetailGrid({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-4">
          <dt className="text-xs font-medium text-[var(--text-muted)]">{item.label}</dt>
          <dd className="mt-1.5 break-words text-sm font-semibold text-[var(--text)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
