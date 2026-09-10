import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ListFilterForm, SearchField, SelectField } from "@/components/ui/filter-controls";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreateCustomerForm } from "@/components/commercial/commercial-forms";
import { PageSection } from "@/components/ui/page-section";
import { getCustomers } from "@/features/customers/server/queries";
import { PAGE_SIZE, parsePage, readParam } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDate, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { canManageCommercialRecords } from "@/types/rbac";

type Row = Awaited<ReturnType<typeof getCustomers>>["rows"][number];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = readParam(params.search);
  const status = readParam(params.status);
  const access = await requireAdminAccess();
  const canManage = access.authorized && canManageCommercialRecords(access.context.role);
  let data;
  try {
    data = await getCustomers({ page, search, status });
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.customersTitle} description={messages.customersDescription} /><ModuleErrorState title={messages.customersLoadError} locale={locale} /></div>;
  }

  const columns: DataTableColumn<Row>[] = [
    { key: "customer", header: messages.customer, render: (row) => <EntityLink href={`/customers/${row.id}`} label={row.businessName} sublabel={row.customerCode} /> },
    { key: "contact", header: messages.contact, render: (row) => <div><p>{row.ownerName}</p><p className="text-xs text-slate-500">{row.email ?? messages.noEmail}</p></div> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "subscription", header: messages.subscription, render: (row) => row.subscriptionStatus ? <StatusBadge label={localizeTerm(row.subscriptionStatus, locale)} tone={statusTone(row.subscriptionStatus)} /> : "—" },
    { key: "expiration", header: messages.expiration, render: (row) => row.subscriptionIsLifetime ? messages.lifetime : formatDate(row.subscriptionExpiresAt, locale) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={messages.customersTitle} description={messages.customersDescription} />
      {canManage ? <PageSection title={locale === "ar" ? "إنشاء عميل" : "Create customer"}><CreateCustomerForm locale={locale} /></PageSection> : null}
      <ListFilterForm action="/customers" locale={locale}>
        <SearchField defaultValue={search} placeholder={messages.searchCustomers} />
        <SelectField name="status" label={messages.customerStatus} defaultValue={status} options={[
          { value: "", label: messages.allStatuses },
          { value: "active", label: localizeTerm("active", locale) },
          { value: "suspended", label: localizeTerm("suspended", locale) },
          { value: "archived", label: localizeTerm("archived", locale) },
        ]} />
      </ListFilterForm>
      <DataTable columns={columns} rows={data.rows} getRowKey={(row) => row.id} emptyState={<EmptyState title={messages.noCustomersFound} description={messages.noCustomersFoundDescription} />} />
      <Pagination basePath="/customers" page={page} pageSize={PAGE_SIZE} total={data.total} query={{ search, status }} locale={locale} />
    </div>
  );
}
