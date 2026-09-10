import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilterForm, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlanForm } from "@/components/commercial/commercial-forms";
import { PageSection } from "@/components/ui/page-section";
import { getPlans } from "@/features/plans/server/queries";
import { PAGE_SIZE, parsePage, readParam } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatMoney, formatNumber, localizeTerm } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { canManageCommercialRecords } from "@/types/rbac";

type Row = Awaited<ReturnType<typeof getPlans>>["rows"][number];

export default async function PlansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const messages = getMessages(locale);
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
    { key: "plan", header: messages.plan, render: (row) => <div><p className="font-semibold text-slate-900">{row.name}</p><bdi className="text-xs text-slate-500">{row.code}{row.is_trial ? ` · ${messages.trial}` : ""}</bdi></div> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.is_enabled ? "enabled" : "disabled", locale)} tone={row.is_enabled ? "success" : "danger"} /> },
    { key: "duration", header: messages.duration, render: (row) => row.is_lifetime ? messages.lifetime : <span><bdi>{row.duration_value}</bdi> {localizeTerm(row.duration_unit ?? "", locale)}</span> },
    { key: "price", header: messages.price, render: (row) => formatMoney(row.price, row.currency, locale) },
    { key: "subscriptions", header: messages.subscriptionsCount, render: (row) => formatNumber(row.subscriptionCount, locale) },
    ...(canManage ? [{ key: "edit", header: messages.action, render: (row: Row) => <details className="min-w-80"><summary className="cursor-pointer font-semibold text-blue-700">{locale === "ar" ? "تعديل الخطة" : "Edit plan"}</summary><div className="mt-3"><PlanForm locale={locale} plan={row} /></div></details> }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={messages.plansTitle} description={messages.plansDescription} />
      {canManage ? <PageSection title={locale === "ar" ? "إنشاء خطة" : "Create plan"}><PlanForm locale={locale} /></PageSection> : null}
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
    </div>
  );
}
