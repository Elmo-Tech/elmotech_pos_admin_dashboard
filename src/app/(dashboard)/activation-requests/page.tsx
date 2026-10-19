import { BadgeCheck, FileDown, FileUp, ShieldCheck } from "lucide-react";
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
import { formatDateTime, formatNumber, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

type Row = Awaited<ReturnType<typeof getActivationRequests>>["rows"][number];

const PAGE_COPY = {
  ar: {
    eyebrow: "مركز معالجة التفعيل",
    title: "فعّل جهاز العميل بثلاث خطوات واضحة.",
    description: "ارفع ملف الطلب، راجع بيانات العميل والجهاز، ثم أصدر ملف الترخيص الجاهز للتسليم — من مكان واحد.",
    heroSteps: [
      { title: "ارفع ملف الطلب", description: "ملف .elmoreq الأصلي من جهاز العميل", icon: FileUp },
      { title: "راجع البيانات", description: "تأكد من العميل والترخيص والجهاز", icon: ShieldCheck },
      { title: "نزّل ملف الترخيص", description: "أرسل ملف .elmolic الناتج للعميل", icon: FileDown },
    ],
    queueTitle: "سجل طلبات التفعيل",
    queueDescription: "تابع الطلبات السابقة وحالتها والجهاز المرتبط بكل طلب.",
    requests: "طلب",
    requestLabel: "طلب تفعيل",
  },
  en: {
    eyebrow: "Activation processing center",
    title: "Activate a customer device in three clear steps.",
    description: "Upload the request, review the customer and device context, then issue a license file ready to deliver — all in one place.",
    heroSteps: [
      { title: "Upload .elmoreq", description: "The original file from the customer device", icon: FileUp },
      { title: "Review details", description: "Confirm the customer, license, and device", icon: ShieldCheck },
      { title: "Download .elmolic", description: "Deliver the issued file to the customer", icon: FileDown },
    ],
    queueTitle: "Activation request history",
    queueDescription: "Track previous requests, their status, and the device linked to each request.",
    requests: "requests",
    requestLabel: "Activation request",
  },
} as const;

export default async function ActivationRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const t = PAGE_COPY[locale];
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
    { key: "request", header: messages.request, render: (row) => <div><p className="font-semibold text-slate-900">{t.requestLabel} <span className="technical-value ms-1 font-mono text-xs text-[var(--primary)]">{shortId(row.request_id)}</span></p><p className="technical-value mt-0.5 text-xs text-slate-500">{messages.appVersion} {row.app_version}</p></div> },
    { key: "customer", header: messages.customer, render: (row) => row.customer ? <EntityLink href={`/customers/${row.customer.id}`} label={row.customer.business_name} /> : "—" },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={row.customer ? (locale === "ar" ? `ترخيص — ${row.customer.business_name}` : `License — ${row.customer.business_name}`) : messages.license} /> },
    { key: "status", header: messages.queueStatus, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "device", header: messages.deviceContext, render: (row) => row.device ? <div><p><span className="technical-value font-mono text-xs">{shortId(row.device.id)}</span></p><p className="text-xs text-slate-500">{localizeTerm(row.device.status, locale)}</p></div> : messages.notLinked },
    { key: "received", header: messages.received, render: (row) => formatDateTime(row.received_at, locale) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="premium-panel p-6 sm:p-8">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(440px,.85fr)] xl:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100"><BadgeCheck aria-hidden="true" size={15} />{t.eyebrow}</span>
            <h1 className="display-heading mt-5 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/75 sm:text-base">{t.description}</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {t.heroSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="bg-[#101b34]/85 p-4">
                  <Icon aria-hidden="true" className="text-blue-300" size={19} />
                  <p className="mt-3 text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100/60">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ActivationWorkflow locale={locale} environment={environment} />
      <ActivationGuide locale={locale} />

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
