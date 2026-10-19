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
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-[-0.015em] text-[var(--text)]">{title}</h2>
          {badge}
        </div>
        {actions}
      </div>
      {description ? <p className="-mt-4 text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
      {children}
    </section>
  );
}
