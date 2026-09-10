import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type { Locale } from "@/i18n/messages";
import { formatDate, formatMoney, formatNumber, localizeTerm, statusTone } from "@/lib/format";

interface SubscriptionSummaryValue {
  status: string;
  starts_at: string;
  expires_at: string | null;
  is_lifetime: boolean;
  plan_name_snapshot: string;
  duration_value_snapshot: number | null;
  duration_unit_snapshot: string | null;
  price_snapshot: number | null;
  currency_snapshot: string | null;
  plan: { name: string } | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_DAYS = 30;

function remainingText(days: number, locale: Locale): string {
  if (days < 0) {
    const elapsed = Math.max(1, Math.floor(Math.abs(days)));
    return locale === "ar"
      ? `انتهى منذ ${formatNumber(elapsed, locale)} يومًا`
      : `Expired ${formatNumber(elapsed, locale)} day${elapsed === 1 ? "" : "s"} ago`;
  }
  const remaining = Math.max(1, Math.ceil(days));
  if (remaining <= SOON_DAYS) {
    return locale === "ar"
      ? `ينتهي خلال ${formatNumber(remaining, locale)} يومًا`
      : `Expires in ${formatNumber(remaining, locale)} day${remaining === 1 ? "" : "s"}`;
  }
  const months = Math.floor(remaining / 30);
  const extraDays = remaining % 30;
  if (months < 2) {
    return locale === "ar"
      ? `متبقي ${formatNumber(remaining, locale)} يوم`
      : `${formatNumber(remaining, locale)} days remaining`;
  }
  const monthText = locale === "ar"
    ? months === 2 ? "شهران" : `${formatNumber(months, locale)} أشهر`
    : `${formatNumber(months, locale)} months`;
  const dayText = extraDays === 0 ? "" : locale === "ar"
    ? ` و${formatNumber(extraDays, locale)} يومًا`
    : ` and ${formatNumber(extraDays, locale)} days`;
  return locale === "ar" ? `متبقي ${monthText}${dayText}` : `${monthText}${dayText} remaining`;
}

export function SubscriptionSummary({ subscription, locale, referenceNow }: { subscription: SubscriptionSummaryValue; locale: Locale; referenceNow: string }) {
  const now = new Date(referenceNow).getTime();
  const start = new Date(subscription.starts_at).getTime();
  const expiry = subscription.expires_at ? new Date(subscription.expires_at).getTime() : null;
  const daysRemaining = expiry === null ? null : (expiry - now) / DAY_MS;
  const expired = !subscription.is_lifetime && (subscription.status === "expired" || (expiry !== null && expiry <= now));
  const expiringSoon = !expired && !subscription.is_lifetime && daysRemaining !== null && daysRemaining <= SOON_DAYS;
  const stateLabel = subscription.is_lifetime
    ? locale === "ar" ? "دائم" : "Lifetime"
    : expired
      ? locale === "ar" ? "منتهي" : "Expired"
      : expiringSoon
        ? locale === "ar" ? "قارب على الانتهاء" : "Expiring soon"
        : localizeTerm(subscription.status, locale);
  const stateTone: StatusTone = expired ? "danger" : expiringSoon ? "warning" : statusTone(subscription.status);
  const duration = subscription.is_lifetime
    ? locale === "ar" ? "دائم" : "Lifetime"
    : `${formatNumber(subscription.duration_value_snapshot ?? 0, locale)} ${localizeTerm(subscription.duration_unit_snapshot ?? "", locale)}`;
  const progress = expiry === null || expiry <= start
    ? null
    : Math.min(100, Math.max(0, ((now - start) / (expiry - start)) * 100));

  return (
    <article className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "ar" ? "الخطة الحالية" : "Current plan"}</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{subscription.plan?.name ?? subscription.plan_name_snapshot}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatMoney(subscription.price_snapshot, subscription.currency_snapshot, locale)}</p>
        </div>
        <StatusBadge label={stateLabel} tone={stateTone} />
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs font-semibold text-slate-500">{locale === "ar" ? "المدة" : "Duration"}</p><p className="mt-1 font-semibold text-slate-900">{duration}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">{locale === "ar" ? "تاريخ البداية" : "Start date"}</p><p className="mt-1 font-semibold text-slate-900">{formatDate(subscription.starts_at, locale)}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">{locale === "ar" ? "تاريخ الانتهاء" : "Expiry date"}</p><p className="mt-1 font-semibold text-slate-900">{subscription.is_lifetime ? (locale === "ar" ? "لا يوجد تاريخ انتهاء" : "No expiry date") : formatDate(subscription.expires_at, locale)}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">{locale === "ar" ? "الوقت المتبقي" : "Remaining time"}</p><p className={`mt-1 font-bold ${expired ? "text-red-700" : expiringSoon ? "text-amber-700" : "text-emerald-700"}`}>{subscription.is_lifetime ? (locale === "ar" ? "لا يوجد تاريخ انتهاء" : "No expiry date") : remainingText(daysRemaining ?? 0, locale)}</p></div>
      </div>
      {progress !== null ? <div className="h-2 bg-slate-100" aria-label={locale === "ar" ? "تقدم مدة الاشتراك" : "Subscription period progress"}><div className={`h-full ${expired ? "bg-red-500" : expiringSoon ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${progress}%` }} /></div> : null}
    </article>
  );
}
