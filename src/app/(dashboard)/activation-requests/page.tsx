import { ActivationWorkflow } from "@/components/activation/activation-workflow";
import { ActivationGuide } from "@/components/activation/activation-guide";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getActivationRequests } from "@/features/operations/server/queries";
import { PAGE_SIZE, parsePage, readParam, shortId } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDateTime, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

type Row = Awaited<ReturnType<typeof getActivationRequests>>["rows"][number];

export default async function ActivationRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = readParam(params.status);
  let data;
  try {
    data = await getActivationRequests({ page, status });
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.activationRequestsTitle} description={messages.activationRequestsDescription} /><ActivationWorkflow locale={locale} environment={environment} /><ModuleErrorState title={messages.requestsLoadError} locale={locale} /></div>;
  }

  const columns: DataTableColumn<Row>[] = [
    { key: "request", header: messages.request, render: (row) => <div><p className="font-semibold text-slate-900">{locale === "ar" ? "طلب تفعيل" : "Activation request"}</p><p className="technical-value text-xs text-slate-500">{messages.appVersion} {row.app_version}</p></div> },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} /> : "—" },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={row.customer ? (locale === "ar" ? `ترخيص — ${row.customer.business_name}` : `License — ${row.customer.business_name}`) : messages.license} /> },
    { key: "status", header: messages.queueStatus, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "device", header: messages.deviceContext, render: (row) => row.device ? <div><p><span className="technical-value font-mono text-xs">{shortId(row.device.id)}</span></p><p className="text-xs text-slate-500">{localizeTerm(row.device.status, locale)}</p></div> : messages.notLinked },
    { key: "received", header: messages.received, render: (row) => formatDateTime(row.received_at, locale) },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title={messages.activationRequestsTitle} description={messages.activationRequestsDescription} />
      <ActivationGuide locale={locale} />
      <ActivationWorkflow locale={locale} environment={environment} />
      <PageSection title={messages.requestQueue}>
        <ListFilterForm action="/activation-requests" locale={locale}>
          <SelectField name="status" label={messages.requestStatus} defaultValue={status} options={[
            { value: "", label: messages.allStatuses },
            { value: "pending", label: localizeTerm("pending", locale) },
            { value: "validated", label: localizeTerm("validated", locale) },
            { value: "consumed", label: localizeTerm("consumed", locale) },
            { value: "rejected", label: localizeTerm("rejected", locale) },
            { value: "expired", label: localizeTerm("expired", locale) },
          ]} />
        </ListFilterForm>
        <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.request_id} emptyState={<EmptyState title={messages.noRequestsFound} description={messages.noRequestsFoundDescription} />} />
        <Pagination basePath="/activation-requests" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ status }} locale={locale} />
      </PageSection>
    </div>
  );
}
