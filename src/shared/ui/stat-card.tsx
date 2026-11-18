import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "blue" | "violet" | "amber" | "emerald" | "rose";
}

const tones = {
  blue: "from-[#0052ff] to-[#4d7cff] shadow-blue-500/25",
  violet: "from-violet-600 to-indigo-500 shadow-violet-500/20",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/20",
  emerald: "from-emerald-600 to-teal-500 shadow-emerald-500/20",
  rose: "from-rose-600 to-pink-500 shadow-rose-500/20",
};

export function StatCard({ label, value, hint, href, icon: Icon, tone = "blue" }: StatCardProps) {
  const content = (
    <div className="relative z-10 flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        {Icon ? <span className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-lg`}><Icon aria-hidden="true" size={19} /></span> : <span />}
        {href ? <ArrowUpRight aria-hidden="true" size={17} className="text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--primary)] rtl:-rotate-90 rtl:group-hover:-translate-x-0.5" /> : null}
      </div>
      <p className="technical-value mt-auto pt-5 text-[32px] font-bold leading-none tracking-[-0.04em] text-[var(--text)]">{value}</p>
      <p className="mt-2 text-[13px] font-semibold text-[var(--text)]">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="group surface-card relative block h-full min-h-[178px] overflow-hidden border-white/80 p-5 transition duration-300 before:absolute before:-end-8 before:-top-8 before:size-24 before:rounded-full before:bg-blue-500/[0.035] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[var(--sh-lg)]"
    >
      {content}
    </Link>
  ) : (
    <div className="surface-card relative h-full min-h-[178px] overflow-hidden border-white/80 p-5">{content}</div>
  );
}
