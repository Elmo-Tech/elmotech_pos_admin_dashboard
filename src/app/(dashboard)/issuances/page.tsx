import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getIssuances } from "@/features/history/server/queries";
import { PAGE_SIZE, parsePage, readParam, shortId } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDate, formatDateTime, localizeTerm } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";

type Row = Awaited<ReturnType<typeof getIssuances>>["rows"][number];

export default async function IssuancesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const params = await searchParams;
  const page = parsePage(params.page);
  const reason = readParam(params.reason);
  let data;
  try { data = await getIssuances({ page, reason }); } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.issuancesTitle} description={messages.issuancesDescription} /><ModuleErrorState locale={locale} /></div>;
  }
  const columns: DataTableColumn<Row>[] = [
    { key: "issuance", header: messages.issuancesTitle, render: (row) => <div><p className="technical-value font-mono text-xs font-semibold text-slate-900">{shortId(row.id)}</p><p className="technical-value text-xs text-slate-500">{messages.format} {row.format_version} · {row.algorithm}</p></div> },
    { key: "revision", header: messages.revision, render: (row) => row.revision },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} sublabel={row.customer.customer_code} /> : "—" },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={shortId(row.license_id)} /> },
    { key: "reason", header: messages.reason, render: (row) => localizeTerm(row.reason, locale) },
    { key: "key", header: messages.signingKeyId, render: (row) => <span className="technical-value font-mono text-xs">{row.key_id}</span> },
    { key: "issued", header: messages.issued, render: (row) => formatDateTime(row.issued_at, locale) },
    { key: "validity", header: messages.validity, render: (row) => row.is_lifetime ? messages.lifetime : `${messages.until} ${formatDate(row.expires_at, locale)}` },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={messages.issuancesTitle} description={messages.issuancesDescription} />
      <ListFilterForm action="/issuances" locale={locale}><SelectField name="reason" label={messages.reason} defaultValue={reason} options={[
        { value: "", label: messages.all }, ...["activation", "renewal", "replacement", "administrative"].map((value) => ({ value, label: localizeTerm(value, locale) })),
      ]} /></ListFilterForm>
      <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noIssuances} description={messages.noRelatedRecords} />} />
      <Pagination basePath="/issuances" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ reason }} locale={locale} />
    </div>
  );
}

