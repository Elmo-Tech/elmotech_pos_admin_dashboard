import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SearchField, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getLicenses } from "@/features/licenses/server/queries";
import { PAGE_SIZE, parsePage, readParam } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDate, formatNumber, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

type Row = Awaited<ReturnType<typeof getLicenses>>["rows"][number];

export default async function LicensesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = readParam(params.search);
  const status = readParam(params.status);
  let data;
  try { data = await getLicenses({ page, search, status }); } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.licensesTitle} description={messages.licensesDescription} /><ModuleErrorState locale={locale} /></div>;
  }
  const columns: DataTableColumn<Row>[] = [
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.id}`} label={row.customer ? (locale === "ar" ? `ترخيص — ${row.customer.business_name}` : `License — ${row.customer.business_name}`) : messages.license} /> },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} /> : "—" },
    { key: "plan", header: messages.plan, render: (row) => <div><p>{row.plan?.name ?? row.subscription?.plan_name_snapshot ?? "—"}</p><p className="text-xs text-slate-500">{row.subscription ? localizeTerm(row.subscription.status, locale) : "—"}</p></div> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "devices", header: messages.activeDevices, render: (row) => <bdi>{formatNumber(row.activeDeviceCount, locale)} / {formatNumber(row.max_active_devices, locale)}</bdi> },
    { key: "revision", header: messages.revision, render: (row) => row.highest_issued_revision },
    { key: "validity", header: messages.validity, render: (row) => row.subscription?.is_lifetime ? messages.lifetime : formatDate(row.subscription?.expires_at ?? null, locale) },
    { key: "created", header: messages.created, render: (row) => formatDate(row.created_at, locale) },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={messages.licensesTitle} description={messages.licensesDescription} />
      <ListFilterForm action="/licenses" locale={locale}>
        <SearchField defaultValue={search} placeholder={messages.searchCustomers} />
        <SelectField name="status" label={messages.licenseStatus} defaultValue={status} options={[
          { value: "", label: messages.allStatuses }, ...["draft", "active", "suspended", "expired", "revoked", "replaced"].map((value) => ({ value, label: localizeTerm(value, locale) })),
        ]} />
      </ListFilterForm>
      <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noLicenses} description={messages.noRelatedRecords} />} />
      <Pagination basePath="/licenses" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ search, status }} locale={locale} />
    </div>
  );
}
