import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--text-muted)]"><Inbox aria-hidden="true" size={20} /></span>
      <p className="text-base font-semibold text-[var(--text)]">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
