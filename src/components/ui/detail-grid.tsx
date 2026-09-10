import type { ReactNode } from "react";

export function DetailGrid({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3">
          <dt className="text-xs font-semibold text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
