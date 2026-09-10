import type { ReactNode } from "react";

interface PageSectionProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** A titled sub-section within a page — e.g. Overview's stat groups. */
export function PageSection({ title, description, badge, actions, children }: PageSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {badge}
        </div>
        {actions}
      </div>
      {description ? <p className="-mt-2 text-xs text-slate-500">{description}</p> : null}
      {children}
    </section>
  );
}
