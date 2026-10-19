import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export function StatCard({ label, value, hint, href }: StatCardProps) {
  const content = (
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--text-muted)]">{label}</p>
        {href ? <ArrowUpRight aria-hidden="true" size={16} className="text-slate-300 transition-colors group-hover:text-[var(--primary)] rtl:-rotate-90" /> : null}
      </div>
      <p className="technical-value mt-3 text-[30px] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="group surface-card border-s-4 border-s-[var(--primary)] p-5 transition hover:-translate-y-px hover:shadow-[var(--sh-md)]"
    >
      {content}
    </Link>
  ) : (
    <div className="surface-card border-s-4 border-s-[var(--primary)] p-5">{content}</div>
  );
}
