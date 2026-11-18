import "server-only";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table";
import { EmptyState } from "@/shared/ui/empty-state";
import { EntityLink } from "@/shared/ui/entity-link";
import { ListFilterForm, SearchField, SelectField } from "@/shared/ui/filter-controls";
import { ModuleErrorState } from "@/shared/ui/module-error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { StatusBadge } from "@/shared/ui/status-badge";
import { CreateCustomerDialog } from "@/features/create-customer";
import { PageSection } from "@/shared/ui/page-section";
import { getCustomers } from "../api/queries";
import { PAGE_SIZE, parsePage, readParam } from "@/shared/lib/query-helpers";
import { getMessages } from "@/shared/i18n";
import { formatDate, formatNumber, localizeTerm, statusTone } from "@/shared/lib/format";
import { getLocale } from "@/shared/i18n/server";
import { getServerEnvironment } from "@/shared/config/server";
import { requireAdminAccess } from "@/entities/session/server";
import { canManageCommercialRecords } from "@/entities/session";

type Row = Awaited<ReturnType<typeof getCustomers>>["rows"][number];

export async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
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
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow={locale === "ar" ? "إدارة العلاقات" : "Relationship management"}
        title={messages.customersTitle}
        description={messages.customersDescription}
        actions={canManage ? <CreateCustomerDialog locale={locale} /> : null}
      />
      <PageSection
        title={locale === "ar" ? "دليل العملاء" : "Customer directory"}
        description={locale === "ar" ? "ابحث وراجع حالة كل عميل واشتراكه من مكان واحد." : "Search and review every customer and subscription state in one place."}
        badge={<span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{formatNumber(data.total, locale)}</span>}
      >
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
      </PageSection>
    </div>
  );
}
