import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { PAGE_SIZE, parsePage, readParam } from "@/features/shared/server/query-helpers";
import { getSubscriptions } from "@/features/subscriptions/server/queries";
import { getMessages } from "@/i18n/messages";
import { formatDate, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

type Row = Awaited<ReturnType<typeof getSubscriptions>>["rows"][number];

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
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
    { key: "plan", header: messages.plan, render: (row) => <div><p className="font-medium">{row.plan?.name ?? row.plan_name_snapshot}</p><bdi className="text-xs text-slate-500">{row.plan?.code ?? messages.snapshot}</bdi></div> },
    { key: "status", header: messages.status, render: (row) => <div className="flex items-center gap-2"><StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} />{row.status === "expired" ? <span className="text-xs font-semibold text-red-700">{messages.renewalRequired}</span> : null}</div> },
    { key: "start", header: messages.start, render: (row) => formatDate(row.starts_at, locale) },
    { key: "expiration", header: messages.expiration, render: (row) => row.is_lifetime ? messages.lifetime : formatDate(row.expires_at, locale) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={locale === "ar" ? "الإيراد والاستمرارية" : "Revenue & retention"} title={messages.subscriptionsTitle} description={messages.subscriptionsDescription} />
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
    </div>
  );
}
