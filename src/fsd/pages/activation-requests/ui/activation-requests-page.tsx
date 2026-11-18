import "server-only";
import { ActivationWorkflow } from "@/features/activate-license";
import { ActivationGuide } from "./activation-guide";
import { ActionDialog } from "@/shared/ui/action-dialog";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table";
import { EmptyState } from "@/shared/ui/empty-state";
import { EntityLink } from "@/shared/ui/entity-link";
import { ListFilterForm, SelectField } from "@/shared/ui/filter-controls";
import { ModuleErrorState } from "@/shared/ui/module-error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageSection } from "@/shared/ui/page-section";
import { Pagination } from "@/shared/ui/pagination";
import { StatusBadge } from "@/shared/ui/status-badge";
import { getActivationRequests } from "../api/get-activation-requests";
import { PAGE_SIZE, parsePage, readParam, shortId } from "@/shared/lib/query-helpers";
import { getMessages } from "@/shared/i18n";
import { formatDateTime, formatNumber, localizeTerm, statusTone } from "@/shared/lib/format";
import { getLocale } from "@/shared/i18n/server";
import { getServerEnvironment } from "@/shared/config/server";

type Row = Awaited<ReturnType<typeof getActivationRequests>>["rows"][number];

const PAGE_COPY = {
  ar: {
    eyebrow: "مركز معالجة التفعيل",
    newRequest: "طلب تفعيل جديد",
    close: "إغلاق",
    title: "فعّل جهاز العميل بثلاث خطوات واضحة.",
    description: "ارفع ملف الطلب، راجع بيانات العميل والجهاز، ثم أصدر ملف الترخيص الجاهز للتسليم — من مكان واحد.",
    queueTitle: "سجل طلبات التفعيل",
    queueDescription: "تابع الطلبات السابقة وحالتها والجهاز المرتبط بكل طلب.",
    requests: "طلب",
    requestLabel: "طلب تفعيل",
  },
  en: {
    eyebrow: "Activation processing center",
    newRequest: "New activation request",
    close: "Close",
    title: "Activate a customer device in three clear steps.",
    description: "Upload the request, review the customer and device context, then issue a license file ready to deliver — all in one place.",
    queueTitle: "Activation request history",
    queueDescription: "Track previous requests, their status, and the device linked to each request.",
    requests: "requests",
    requestLabel: "Activation request",
  },
} as const;

export async function ActivationRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const t = PAGE_COPY[locale];
  const params = await searchParams;
  const page = parsePage(params.page);
  const status = readParam(params.status);
  const activationAction = (
    <ActionDialog triggerLabel={t.newRequest} title={t.newRequest} description={t.description} closeLabel={t.close} size="xl">
      <div className="flex flex-col gap-5">
        <ActivationWorkflow locale={locale} environment={environment} embedded />
        <ActivationGuide locale={locale} />
      </div>
    </ActionDialog>
  );
  let data;
  try {
    data = await getActivationRequests({ page, status });
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.activationRequestsTitle} description={messages.activationRequestsDescription} actions={activationAction} /><ModuleErrorState title={messages.requestsLoadError} locale={locale} /></div>;
  }

  const columns: DataTableColumn<Row>[] = [
    { key: "request", header: messages.request, render: (row) => <div><p className="font-semibold text-slate-900">{t.requestLabel} <span className="technical-value ms-1 font-mono text-xs text-[var(--primary)]">{shortId(row.request_id)}</span></p><p className="technical-value mt-0.5 text-xs text-slate-500">{messages.appVersion} {row.app_version}</p></div> },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} /> : "—" },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={row.customer ? (locale === "ar" ? `ترخيص — ${row.customer.business_name}` : `License — ${row.customer.business_name}`) : messages.license} /> },
    { key: "status", header: messages.queueStatus, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "device", header: messages.deviceContext, render: (row) => row.device ? <div><p><span className="technical-value font-mono text-xs">{shortId(row.device.id)}</span></p><p className="text-xs text-slate-500">{localizeTerm(row.device.status, locale)}</p></div> : messages.notLinked },
    { key: "received", header: messages.received, render: (row) => formatDateTime(row.received_at, locale) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={t.eyebrow} title={messages.activationRequestsTitle} description={t.queueDescription} actions={activationAction} />

      <PageSection
        title={t.queueTitle}
        description={t.queueDescription}
        badge={<span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{formatNumber(data.total, locale)} {t.requests}</span>}
      >
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
