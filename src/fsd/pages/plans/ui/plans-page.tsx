import "server-only";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Boxes, InfinityIcon, Sparkles, UsersRound } from "lucide-react";
import { PlanDialog } from "@/features/manage-plan";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table";
import { EmptyState } from "@/shared/ui/empty-state";
import { ListFilterForm, SelectField } from "@/shared/ui/filter-controls";
import { ModuleErrorState } from "@/shared/ui/module-error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageSection } from "@/shared/ui/page-section";
import { Pagination } from "@/shared/ui/pagination";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusBadge } from "@/shared/ui/status-badge";
import { getPlans } from "../api/get-plans";
import { PAGE_SIZE, parsePage, readParam } from "@/shared/lib/query-helpers";
import { getMessages } from "@/shared/i18n";
import { formatMoney, formatNumber, localizeTerm } from "@/shared/lib/format";
import { requireAdminAccess } from "@/entities/session/server";
import { getServerEnvironment } from "@/shared/config/server";
import { getLocale } from "@/shared/i18n/server";
import { canManageCommercialRecords } from "@/entities/session";

type Row = Awaited<ReturnType<typeof getPlans>>["rows"][number];

const PAGE_COPY = {
  ar: {
    eyebrow: "كتالوج المنتجات",
    title: "صمّم خططاً واضحة يسهل بيعها وإدارتها.",
    description: "تابع إتاحة الخطط ومددها وانتشارها بين العملاء من كتالوج تجاري واحد.",
    catalog: "كتالوج الخطط",
    catalogDescription: "قارن الخطط وعدّلها أو استعرض الاشتراكات المرتبطة بها.",
    records: "خطة",
    total: "إجمالي الخطط",
    totalHint: "كل المنتجات المسجلة",
    enabled: "الخطط المتاحة",
    enabledHint: "جاهزة للاشتراكات الجديدة",
    lifetime: "الخطط الدائمة",
    lifetimeHint: "لا ترتبط بتاريخ انتهاء",
    subscriptions: "اشتراكات العملاء",
    subscriptionsHint: "مرتبطة بخطط الكتالوج",
    unpriced: "غير مسعّرة",
    openSubscriptions: "عرض الاشتراكات",
  },
  en: {
    eyebrow: "Product catalog",
    title: "Build clear plans that are easy to sell and manage.",
    description: "Track plan availability, duration, and customer adoption from one commercial catalog.",
    catalog: "Plans catalog",
    catalogDescription: "Compare plans, edit them, or inspect their linked subscriptions.",
    records: "plans",
    total: "Total plans",
    totalHint: "All recorded products",
    enabled: "Available plans",
    enabledHint: "Ready for new subscriptions",
    lifetime: "Lifetime plans",
    lifetimeHint: "No expiration date",
    subscriptions: "Customer subscriptions",
    subscriptionsHint: "Linked to catalog plans",
    unpriced: "Not priced",
    openSubscriptions: "View subscriptions",
  },
} as const;

export async function PlansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const t = PAGE_COPY[locale];
  const params = await searchParams;
  const page = parsePage(params.page);
  const enabled = readParam(params.enabled);
  const lifetime = readParam(params.lifetime);
  const access = await requireAdminAccess();
  const canManage = access.authorized && canManageCommercialRecords(access.context.role);
  let data;
  try {
    data = await getPlans({ page, enabled, lifetime });
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.plansTitle} description={messages.plansDescription} /><ModuleErrorState title={messages.plansLoadError} locale={locale} /></div>;
  }

  const columns: DataTableColumn<Row>[] = [
    { key: "plan", header: messages.plan, render: (row) => <div><p className="font-semibold text-[var(--text)]">{row.name}</p><bdi className="mt-0.5 block text-xs text-[var(--text-muted)]">{row.code}{row.is_trial ? ` · ${messages.trial}` : ""}</bdi></div> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.is_enabled ? "enabled" : "disabled", locale)} tone={row.is_enabled ? "success" : "danger"} /> },
    { key: "duration", header: messages.duration, render: (row) => row.is_lifetime ? <span className="font-semibold text-[var(--text)]">{messages.lifetime}</span> : <span><bdi className="font-semibold text-[var(--text)]">{row.duration_value}</bdi> {localizeTerm(row.duration_unit ?? "", locale)}</span> },
    { key: "price", header: messages.price, render: (row) => row.price === null || !row.currency ? <span className="text-xs font-semibold text-slate-500">{t.unpriced}</span> : <span className="font-semibold text-[var(--text)]">{formatMoney(row.price, row.currency, locale)}</span> },
    { key: "subscriptions", header: messages.subscriptionsCount, render: (row) => <Link href={`/subscriptions?plan=${row.id}`} aria-label={`${t.openSubscriptions}: ${row.name}`} className="group inline-flex items-center gap-2 rounded-lg bg-[var(--primary-soft)] px-2.5 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-blue-100"><span className="technical-value">{formatNumber(row.subscriptionCount, locale)}</span><ArrowUpRight aria-hidden="true" size={13} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-rotate-90" /></Link> },
    ...(canManage ? [{ key: "edit", header: messages.action, render: (row: Row) => <PlanDialog locale={locale} plan={row} /> }] : []),
  ];

  const metrics = [
    { label: t.total, value: data.summary.all, hint: t.totalHint, href: "/plans", icon: Boxes, tone: "blue" as const },
    { label: t.enabled, value: data.summary.enabled, hint: t.enabledHint, href: "/plans?enabled=true", icon: BadgeCheck, tone: "emerald" as const },
    { label: t.lifetime, value: data.summary.lifetime, hint: t.lifetimeHint, href: "/plans?lifetime=true", icon: InfinityIcon, tone: "violet" as const },
    { label: t.subscriptions, value: data.summary.subscriptions, hint: t.subscriptionsHint, href: "/subscriptions", icon: UsersRound, tone: "amber" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="premium-panel animate-fade-up p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100"><Sparkles aria-hidden="true" size={14} />{t.eyebrow}</span>
            <h1 className="display-heading mt-5 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/75 sm:text-base">{t.description}</p>
          </div>
          {canManage ? <PlanDialog locale={locale} /> : null}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <StatCard key={metric.label} {...metric} value={formatNumber(metric.value, locale)} />)}
      </div>

      <PageSection title={t.catalog} description={t.catalogDescription} badge={<span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{formatNumber(data.total, locale)} {t.records}</span>}>
        <ListFilterForm action="/plans" locale={locale}>
          <SelectField name="enabled" label={messages.enabledStatus} defaultValue={enabled} options={[
            { value: "", label: messages.anyStatus },
            { value: "true", label: localizeTerm("enabled", locale) },
            { value: "false", label: localizeTerm("disabled", locale) },
          ]} />
          <SelectField name="lifetime" label={messages.planDuration} defaultValue={lifetime} options={[
            { value: "", label: messages.anyDuration },
            { value: "true", label: messages.lifetime },
            { value: "false", label: messages.timeLimited },
          ]} />
        </ListFilterForm>
        <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noPlansFound} description={messages.noPlansFoundDescription} />} />
        <Pagination basePath="/plans" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ enabled, lifetime }} locale={locale} />
      </PageSection>
    </div>
  );
}
