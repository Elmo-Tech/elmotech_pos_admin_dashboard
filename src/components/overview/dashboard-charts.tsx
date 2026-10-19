import { ArrowUpRight, CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import type { Locale } from "@/i18n/messages";
import { formatNumber } from "@/lib/format";

interface TrendPoint {
  label: string;
  value: number;
}

export function CustomerGrowthChart({ data, locale }: { data: readonly TrendPoint[]; locale: Locale }) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const copy = locale === "ar"
    ? { title: "نمو قاعدة العملاء", description: "العملاء الجدد خلال آخر 6 أشهر", total: "عميل جديد" }
    : { title: "Customer growth", description: "New customers during the last 6 months", total: "new customers" };

  return (
    <section className="surface-card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">{locale === "ar" ? "اتجاه النمو" : "Growth trend"}</span>
          <h2 className="mt-3 text-lg font-bold text-[var(--text)]">{copy.title}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{copy.description}</p>
        </div>
        <div className="rounded-xl bg-[var(--primary-soft)] px-3.5 py-2 text-end">
          <p className="technical-value text-xl font-bold text-[var(--primary)]">+{formatNumber(total, locale)}</p>
          <p className="text-[11px] font-semibold text-[var(--on-primary-soft)]">{copy.total}</p>
        </div>
      </div>

      <div className="mt-8 flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label={`${copy.title}: ${total}`}>
        {data.map((point, index) => {
          const height = point.value === 0 ? 8 : Math.max(22, Math.round((point.value / max) * 100));
          return (
            <div key={`${point.label}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
              <div className="relative flex flex-1 items-end justify-center rounded-xl bg-slate-50 px-1">
                <span className="absolute top-2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">{formatNumber(point.value, locale)}</span>
                <div
                  className="w-full max-w-11 rounded-t-[10px] bg-[linear-gradient(180deg,var(--primary-secondary),var(--primary))] shadow-[0_8px_20px_rgba(0,82,255,0.18)] transition-all duration-500 group-hover:brightness-110"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="truncate text-center text-[11px] font-medium text-[var(--text-muted)]">{point.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SubscriptionHealth({
  active,
  expiring,
  expired,
  total,
  locale,
}: {
  active: number;
  expiring: number;
  expired: number;
  total: number;
  locale: Locale;
}) {
  const activeShare = total > 0 ? Math.round((active / total) * 100) : 0;
  const safeActive = Math.max(active - expiring, 0);
  const other = Math.max(total - active - expired, 0);
  const segments = [
    { label: locale === "ar" ? "نشطة" : "Healthy", value: safeActive, color: "#0052ff", icon: CheckCircle2 },
    { label: locale === "ar" ? "تحتاج متابعة" : "Expiring", value: expiring, color: "#f59e0b", icon: Clock3 },
    { label: locale === "ar" ? "منتهية" : "Expired", value: expired + other, color: "#ef4444", icon: CircleAlert },
  ];
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += total > 0 ? (segment.value / total) * 360 : 0;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });

  return (
    <section className="surface-card p-5 sm:p-6">
      <span className="eyebrow">{locale === "ar" ? "صحة الاشتراكات" : "Subscription health"}</span>
      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
        <div className="relative mx-auto grid size-36 place-items-center rounded-full" style={{ background: total > 0 ? `conic-gradient(${stops.join(",")})` : "var(--muted)" }}>
          <div className="grid size-24 place-items-center rounded-full bg-white text-center shadow-inner">
            <div>
              <p className="technical-value text-2xl font-bold text-[var(--text)]">{formatNumber(activeShare, locale)}%</p>
              <p className="text-[10px] font-semibold text-[var(--text-muted)]">{locale === "ar" ? "نشطة" : "active"}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {segments.map((segment) => {
            const Icon = segment.icon;
            return (
              <div key={segment.label} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-slate-50/70 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-white shadow-sm"><Icon aria-hidden="true" size={15} style={{ color: segment.color }} /></span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">{segment.label}</span>
                </div>
                <span className="technical-value text-sm font-bold text-[var(--text)]">{formatNumber(segment.value, locale)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <a href="/subscriptions" className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--primary)]">
        {locale === "ar" ? "إدارة الاشتراكات" : "Manage subscriptions"}
        <ArrowUpRight aria-hidden="true" size={16} className="rtl:-rotate-90" />
      </a>
    </section>
  );
}
