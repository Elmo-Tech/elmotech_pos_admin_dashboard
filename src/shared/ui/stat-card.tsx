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

export function StatCard({ label, value, hint, href, icon: Icon, tone = "blue" }: StatCardProps) {
  const content = <>
    <div className="stat-card-top"><span className="stat-label">{label}</span>{Icon ? <span className={`stat-icon tone-${tone}`}><Icon aria-hidden="true" size={19} strokeWidth={1.8} /></span> : null}</div>
    <p className="technical-value stat-value">{value}</p>
    <div className="stat-card-bottom"><p>{hint ?? label}</p>{href ? <ArrowUpRight aria-hidden="true" size={16} className="rtl:-rotate-90" /> : null}</div>
  </>;
  return href ? <Link href={href} className="stat-card">{content}</Link> : <div className="stat-card">{content}</div>;
}
