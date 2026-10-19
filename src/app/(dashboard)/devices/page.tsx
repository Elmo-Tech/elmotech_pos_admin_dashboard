import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDevices } from "@/features/operations/server/queries";
import { PAGE_SIZE, parsePage, readParam, shortId } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDateTime, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

type Row = Awaited<ReturnType<typeof getDevices>>["rows"][number];

export default async function DevicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = readParam(params.status);
  let data;
  try { data = await getDevices({ page, status }); } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.devicesTitle} description={messages.devicesDescription} /><ModuleErrorState locale={locale} /></div>;
  }
  const columns: DataTableColumn<Row>[] = [
    { key: "device", header: messages.device, render: (row) => <div><p className="technical-value font-mono text-xs font-semibold text-slate-900">{shortId(row.id)}</p><p className="text-xs text-slate-500">{localizeTerm(row.activation_type, locale)}</p></div> },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} sublabel={row.customer.customer_code} /> : "—" },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={`${messages.license} ${shortId(row.license_id)}`} /> },
    { key: "status", header: messages.activationState, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "activated", header: messages.activated, render: (row) => formatDateTime(row.activated_at, locale) },
    { key: "lastIssued", header: messages.lastIssued, render: (row) => formatDateTime(row.last_issued_at, locale) },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={locale === "ar" ? "البنية النشطة" : "Active estate"} title={messages.devicesTitle} description={messages.devicesDescription} />
      <ListFilterForm action="/devices" locale={locale}><SelectField name="status" label={messages.deviceState} defaultValue={status} options={[
        { value: "", label: messages.allStatuses }, ...["pending", "active", "replaced", "deactivated", "revoked"].map((value) => ({ value, label: localizeTerm(value, locale) })),
      ]} /></ListFilterForm>
      <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noDevices} description={messages.noRelatedRecords} />} />
      <Pagination basePath="/devices" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ status }} locale={locale} />
    </div>
  );
}
