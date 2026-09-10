import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-600/10",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/10",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}
