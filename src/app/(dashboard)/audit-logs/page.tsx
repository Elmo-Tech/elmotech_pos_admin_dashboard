import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SearchField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getAuditLogs } from "@/features/history/server/queries";
import { PAGE_SIZE, parsePage, readParam, shortId } from "@/features/shared/server/query-helpers";
import { getMessages, type Locale } from "@/i18n/messages";
import { formatDateTime, localizeTerm } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";
import type { Json } from "@/types/database";

type Row = Awaited<ReturnType<typeof getAuditLogs>>["rows"][number];

function metadataSummary(metadata: Json, locale: Locale): string {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") return "—";
  return Object.entries(metadata).flatMap(([key, value]) =>
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? [`${localizeTerm(key, locale)}: ${String(value).slice(0, 40)}`]
      : [],
  ).slice(0, 3).join(" · ") || "—";
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const params = await searchParams;
  const page = parsePage(params.page);
  const action = readParam(params.action);
  let data;
  try { data = await getAuditLogs({ page, action }); } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.auditLogsTitle} description={messages.auditLogsDescription} /><ModuleErrorState locale={locale} /></div>;
  }
  const columns: DataTableColumn<Row>[] = [
    { key: "time", header: messages.timestamp, render: (row) => formatDateTime(row.created_at, locale) },
    { key: "action", header: messages.action, render: (row) => <span className="font-medium text-slate-900">{localizeTerm(row.action, locale)}</span> },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} sublabel={row.customer.customer_code} /> : "—" },
    { key: "entity", header: messages.relatedEntity, render: (row) => row.license_id ? <EntityLink href={`/licenses/${row.license_id}`} label={`${messages.license} ${shortId(row.license_id)}`} /> : <span className="technical-value font-mono text-xs">{shortId(row.activation_id ?? row.issuance_id ?? row.subscription_id ?? row.id)}</span> },
    { key: "actor", header: messages.actor, render: (row) => row.actor_user_id ? messages.adminUser : messages.system },
    { key: "details", header: messages.detailsLabel, render: (row) => <span className="block max-w-80 truncate text-xs text-slate-500" title={metadataSummary(row.metadata, locale)}>{metadataSummary(row.metadata, locale)}</span> },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={locale === "ar" ? "الحوكمة والتتبّع" : "Governance & traceability"} title={messages.auditLogsTitle} description={messages.auditLogsDescription} />
      <ListFilterForm action="/audit-logs" locale={locale}><SearchField name="action" defaultValue={action} placeholder={messages.filterAction} /></ListFilterForm>
      <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noAuditHistory} description={messages.noRelatedRecords} />} />
      <Pagination basePath="/audit-logs" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ action }} locale={locale} />
    </div>
  );
}
