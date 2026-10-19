import Link from "next/link";
import { BadgeCheck, CalendarClock, CircleAlert, Layers3, Sparkles } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PAGE_SIZE, parsePage, readParam } from "@/features/shared/server/query-helpers";
import { getSubscriptions } from "@/features/subscriptions/server/queries";
import { getMessages, type Locale } from "@/i18n/messages";
import { formatDate, formatNumber, localizeTerm, statusTone } from "@/lib/format";
import { getServerEnvironment } from "@/server/env";
import { getLocale } from "@/server/i18n/get-locale";

type Row = Awaited<ReturnType<typeof getSubscriptions>>["rows"][number];

const PAGE_COPY = {
  ar: {
    eyebrow: "صحة الاشتراكات",
    title: "تابع صلاحية كل اشتراك قبل أن يتحول إلى مشكلة.",
    description: "شاهد الاشتراكات السارية والقريبة من الانتهاء، ثم انتقل مباشرة إلى ملف العميل لاتخاذ الإجراء المناسب.",
    browsePlans: "إدارة الخطط",
    pulse: "حالة المحفظة",
    healthy: "سارية الآن",
    attention: "تحتاج متابعة",
    portfolio: "محفظة الاشتراكات",
    portfolioDescription: "استخدم الحالة والخطة للوصول سريعاً إلى الاشتراك المطلوب.",
    records: "اشتراك",
    total: "إجمالي الاشتراكات",
    totalHint: "كل الاشتراكات المسجلة",
    active: "الاشتراكات السارية",
    activeHint: "نشطة وصالحة للاستخدام الآن",
    expiring: "تنتهي خلال 30 يوماً",
    expiringHint: "الأولوية الأولى للمتابعة",
    expired: "الاشتراكات المنتهية",
    expiredHint: "تحتاج إلى تجديد أو مراجعة",
    permanent: "صلاحية دائمة",
    noExpiry: "لا يوجد تاريخ انتهاء",
    expiredAgo: "انتهى الاشتراك",
    today: "ينتهي اليوم",
    remainingDay: "متبقٍ يوم واحد",
    remainingDays: (days: number) => `متبقٍ ${formatNumber(days, "ar")} يوم`,
  },
  en: {
    eyebrow: "Subscription health",
    title: "See every subscription risk before it becomes a problem.",
    description: "Monitor valid and expiring subscriptions, then jump straight to the customer profile to take action.",
    browsePlans: "Manage plans",
    pulse: "Portfolio health",
    healthy: "Valid now",
    attention: "Need attention",
    portfolio: "Subscription portfolio",
    portfolioDescription: "Use status and plan filters to reach the right subscription quickly.",
    records: "subscriptions",
    total: "Total subscriptions",
    totalHint: "All recorded subscriptions",
    active: "Valid subscriptions",
    activeHint: "Active and usable right now",
    expiring: "Ending within 30 days",
    expiringHint: "First priority for follow-up",
    expired: "Expired subscriptions",
    expiredHint: "Require renewal or review",
    permanent: "Lifetime validity",
    noExpiry: "No expiration date",
    expiredAgo: "Subscription has ended",
    today: "Ends today",
    remainingDay: "1 day remaining",
    remainingDays: (days: number) => `${formatNumber(days, "en")} days remaining`,
  },
} as const;

function validityHint(row: Row, referenceNow: string, locale: Locale) {
  const t = PAGE_COPY[locale];
  if (row.is_lifetime) return { label: t.noExpiry, tone: "text-emerald-700" };
  if (!row.expires_at) return { label: "—", tone: "text-slate-500" };
  const days = Math.ceil((new Date(row.expires_at).getTime() - new Date(referenceNow).getTime()) / 86_400_000);
  if (days < 0 || row.status === "expired") return { label: t.expiredAgo, tone: "text-red-700" };
  if (days === 0) return { label: t.today, tone: "text-amber-700" };
  if (days === 1) return { label: t.remainingDay, tone: "text-amber-700" };
  return { label: t.remainingDays(days), tone: days <= 30 ? "text-amber-700" : "text-slate-500" };
}

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const t = PAGE_COPY[locale];
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = readParam(params.status);
  const planId = readParam(params.plan);
  let data;
  try {
    data = await getSubscriptions({ page, status, planId });
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.subscriptionsTitle} description={messages.subscriptionsDescription} /><ModuleErrorState title={messages.subscriptionsLoadError} locale={locale} /></div>;
  }

  const columns: DataTableColumn<Row>[] = [
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} sublabel={row.customer.customer_code} /> : "—" },
    { key: "plan", header: messages.plan, render: (row) => <div><p className="font-semibold text-[var(--text)]">{row.plan?.name ?? row.plan_name_snapshot}</p><bdi className="mt-0.5 block text-xs text-[var(--text-muted)]">{row.plan?.code ?? messages.snapshot}</bdi></div> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "start", header: messages.start, render: (row) => formatDate(row.starts_at, locale) },
    { key: "expiration", header: messages.expiration, render: (row) => {
      const hint = validityHint(row, data.referenceNow, locale);
      return <div><p className="font-semibold text-[var(--text)]">{row.is_lifetime ? t.permanent : formatDate(row.expires_at, locale)}</p><p className={`mt-1 text-xs font-medium ${hint.tone}`}>{hint.label}</p></div>;
    } },
  ];

  const metrics = [
    { label: t.total, value: data.summary.all, hint: t.totalHint, href: "/subscriptions", icon: Layers3, tone: "blue" as const },
    { label: t.active, value: data.summary.active, hint: t.activeHint, href: "/subscriptions?status=active", icon: BadgeCheck, tone: "emerald" as const },
    { label: t.expiring, value: data.summary.expiring, hint: t.expiringHint, href: "/subscriptions?status=expiring", icon: CalendarClock, tone: "amber" as const },
    { label: t.expired, value: data.summary.expired, hint: t.expiredHint, href: "/subscriptions?status=expired", icon: CircleAlert, tone: "rose" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="premium-panel animate-fade-up p-6 sm:p-8">
        <div className="grid items-end gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100"><Sparkles aria-hidden="true" size={14} />{t.eyebrow}</span>
            <h1 className="display-heading mt-5 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/75 sm:text-base">{t.description}</p>
            <Link href="/plans" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.14]">{t.browsePlans}</Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold text-blue-200">{t.pulse}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div><p className="technical-value text-3xl font-bold text-white">{formatNumber(data.summary.active, locale)}</p><p className="mt-1 text-xs text-slate-400">{t.healthy}</p></div>
              <div><p className={`technical-value text-3xl font-bold ${data.summary.expiring + data.summary.expired > 0 ? "text-amber-300" : "text-white"}`}>{formatNumber(data.summary.expiring + data.summary.expired, locale)}</p><p className="mt-1 text-xs text-slate-400">{t.attention}</p></div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <StatCard key={metric.label} {...metric} value={formatNumber(metric.value, locale)} />)}
      </div>

      <PageSection title={t.portfolio} description={t.portfolioDescription} badge={<span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{formatNumber(data.total, locale)} {t.records}</span>}>
        <ListFilterForm action="/subscriptions" locale={locale}>
          <SelectField name="status" label={messages.subscriptionStatus} defaultValue={status} options={[
            { value: "", label: messages.all },
            { value: "active", label: localizeTerm("active", locale) },
            { value: "expiring", label: messages.expiringSoon },
            { value: "expired", label: localizeTerm("expired", locale) },
            { value: "lifetime", label: messages.lifetime },
          ]} />
          <SelectField name="plan" label={messages.plan} defaultValue={planId} options={[{ value: "", label: messages.allPlans }, ...data.plans.map((plan) => ({ value: plan.id, label: plan.name }))]} />
        </ListFilterForm>
        <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noSubscriptionsFound} description={messages.noSubscriptionsFoundDescription} />} />
        <Pagination basePath="/subscriptions" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ status, plan: planId }} locale={locale} />
      </PageSection>
    </div>
  );
}
