import { cn } from "@/shared/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<StatusTone, string> = {
  neutral: "bg-[var(--muted)] text-slate-700 ring-slate-600/10 before:bg-slate-500",
  success: "bg-[var(--success-soft)] text-[var(--success)] ring-green-700/10 before:bg-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)] ring-amber-700/10 before:bg-[var(--warning)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] ring-red-700/10 before:bg-[var(--danger)]",
  info: "bg-[var(--info-soft)] text-[var(--info)] ring-blue-700/10 before:bg-[var(--info)]",
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "before:me-1.5 before:size-1.5 before:rounded-full inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}
