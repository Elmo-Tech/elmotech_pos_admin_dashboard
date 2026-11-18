import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps { title: string; description?: string; action?: ReactNode }
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <div className="empty-state"><span className="empty-state-symbol"><Inbox aria-hidden="true" size={26} strokeWidth={1.4} /></span><p className="text-sm font-semibold text-[var(--text)]">{title}</p>{description ? <p className="mt-2 max-w-sm text-xs leading-6 text-[var(--text-muted)]">{description}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</div>;
}
