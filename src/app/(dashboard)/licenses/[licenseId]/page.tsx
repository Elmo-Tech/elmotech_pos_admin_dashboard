import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DetailGrid } from "@/components/ui/detail-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { SectionNav } from "@/components/ui/section-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { RotateLicenseCodeForm } from "@/components/commercial/commercial-forms";
import { getLicenseDetail } from "@/features/licenses/server/queries";
import { shortId } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDate, formatDateTime, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { canManageCommercialRecords } from "@/types/rbac";

type Detail = NonNullable<Awaited<ReturnType<typeof getLicenseDetail>>>;
type Device = Detail["devices"][number];
type RequestRow = Detail["requests"][number];
type Issuance = Detail["issuances"][number];
type Audit = Detail["audit"][number];

export default async function LicenseDetailPage({ params }: { params: Promise<{ licenseId: string }> }) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const { licenseId } = await params;
  const access = await requireAdminAccess();
  const canManage = access.authorized && canManageCommercialRecords(access.context.role);
  let data: Detail | null;
  try { data = await getLicenseDetail(licenseId); } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.licenseDetails} description={messages.licensesDescription} /><ModuleErrorState locale={locale} /></div>;
  }
  if (!data) notFound();
  const empty = (title: string) => <EmptyState title={title} description={messages.noRelatedRecords} />;
  const activeDevices = data.devices.filter((row) => row.status === "active").length;
  const awaitingActivation = data.license.status === "draft" && data.devices.length === 0;
  const activationState = awaitingActivation
    ? locale === "ar" ? "بانتظار التفعيل" : "Awaiting activation"
    : localizeTerm(data.devices.find((row) => row.status === "active")?.status ?? data.devices[0]?.status ?? "none", locale);
  const canRotateCode = canManage && data.license.status === "draft" && data.license.highest_issued_revision === 0 && data.devices.length === 0 && data.requests.length === 0 && data.issuances.length === 0;
  const customerName = data.customer?.business_name ?? (locale === "ar" ? "عميل غير متاح" : "Unavailable customer");
  const deviceColumns: DataTableColumn<Device>[] = [
    { key: "device", header: messages.device, render: (row) => <span className="technical-value font-mono text-xs">{shortId(row.id)}</span> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "activated", header: messages.activated, render: (row) => formatDateTime(row.activated_at, locale) },
    { key: "lastIssued", header: messages.lastIssued, render: (row) => formatDateTime(row.last_issued_at, locale) },
  ];
  const requestColumns: DataTableColumn<RequestRow>[] = [
    { key: "request", header: messages.request, render: (row) => <span className="technical-value font-mono text-xs">{shortId(row.request_id)}</span> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "app", header: messages.appVersion, render: (row) => <span className="technical-value">{row.app_version}</span> },
    { key: "received", header: messages.received, render: (row) => formatDateTime(row.received_at, locale) },
  ];
  const issuanceColumns: DataTableColumn<Issuance>[] = [
    { key: "revision", header: messages.revision, render: (row) => row.revision },
    { key: "reason", header: messages.reason, render: (row) => localizeTerm(row.reason, locale) },
    { key: "key", header: messages.signingKeyId, render: (row) => <span className="technical-value font-mono text-xs">{row.key_id}</span> },
    { key: "issued", header: messages.issued, render: (row) => formatDateTime(row.issued_at, locale) },
    { key: "expires", header: messages.expires, render: (row) => row.is_lifetime ? messages.lifetime : formatDate(row.expires_at, locale) },
  ];
  const auditColumns: DataTableColumn<Audit>[] = [
    { key: "time", header: messages.timestamp, render: (row) => formatDateTime(row.created_at, locale) },
    { key: "action", header: messages.action, render: (row) => localizeTerm(row.action, locale) },
    { key: "context", header: messages.context, render: (row) => <span className="technical-value font-mono text-xs">{shortId(row.issuance_id ?? row.activation_id ?? row.id)}</span> },
  ];
  return (
    <div className="flex flex-col gap-7">
      <PageHeader title={locale === "ar" ? `ترخيص — ${customerName}` : `License — ${customerName}`} description={messages.licenseDetails} actions={<Link href="/licenses" className="text-sm font-semibold text-blue-700 hover:underline">{messages.backToLicenses}</Link>} />
      <SectionNav ariaLabel={messages.pageSections} items={[
        { href: "#overview", label: messages.overviewTitle },
        { href: "#devices", label: messages.device },
        { href: "#requests", label: messages.activationRequestsTitle },
        { href: "#issuances", label: messages.issuancesTitle },
        { href: "#audit", label: messages.auditLogsTitle },
      ]} />
      <div id="overview"><DetailGrid items={[
        { label: messages.customer, value: data.customer ? <Link href={`/customers/${data.customer.id}`} className="text-blue-700 hover:underline">{data.customer.business_name}</Link> : "—" },
        { label: messages.plan, value: data.plan?.name ?? data.subscription?.plan_name_snapshot ?? "—" },
        { label: messages.subscription, value: data.subscription ? localizeTerm(data.subscription.status, locale) : "—" },
        { label: messages.licenseStatus, value: <StatusBadge label={localizeTerm(data.license.status, locale)} tone={statusTone(data.license.status)} /> },
        { label: messages.activationState, value: <StatusBadge label={activationState} tone={awaitingActivation ? "warning" : statusTone(data.devices.find((row) => row.status === "active")?.status ?? data.devices[0]?.status ?? "none")} /> },
        { label: messages.activeDevices, value: activeDevices },
        { label: messages.validity, value: data.subscription?.is_lifetime ? messages.lifetime : formatDate(data.subscription?.expires_at ?? null, locale) },
        { label: messages.created, value: formatDate(data.license.created_at, locale) },
      ]} /></div>
      <PageSection title={locale === "ar" ? "كود الترخيص" : "License Code"}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-bold text-slate-950">{locale === "ar" ? "تم إنشاؤه — غير متاح للعرض مرة أخرى" : "Created — unavailable to display again"}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{locale === "ar" ? "لأسباب أمنية، لا يحتفظ النظام بنسخة قابلة للعرض من الكود الأصلي." : "For security, the system does not retain a displayable copy of the original code."}</p>
          {canRotateCode ? <div className="mt-4"><RotateLicenseCodeForm locale={locale} licenseId={data.license.id} /></div> : null}
        </div>
      </PageSection>
      <div id="devices"><PageSection title={messages.devicesTitle}><DataTable columns={deviceColumns} rows={data.devices} getRowKey={(row) => row.id} emptyState={empty(messages.noDevices)} /></PageSection></div>
      <div id="requests"><PageSection title={messages.activationRequestsTitle}><DataTable columns={requestColumns} rows={data.requests} getRowKey={(row) => row.request_id} emptyState={empty(messages.noActivationRequests)} /></PageSection></div>
      <div id="issuances"><PageSection title={messages.issuancesTitle}><DataTable columns={issuanceColumns} rows={data.issuances} getRowKey={(row) => row.id} emptyState={empty(messages.noIssuances)} /></PageSection></div>
      <div id="audit"><PageSection title={messages.auditLogsTitle}><DataTable columns={auditColumns} rows={data.audit} getRowKey={(row) => row.id} emptyState={empty(messages.noAuditHistory)} /></PageSection></div>
      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">{messages.technicalDetails}</summary>
        <div className="border-t border-slate-200 p-5">
          <DetailGrid items={[
            { label: messages.licenseId, value: <span className="technical-value font-mono text-xs">{data.license.id}</span> },
            { label: messages.subscriptionId, value: <span className="technical-value font-mono text-xs">{data.license.subscription_id}</span> },
            { label: messages.revision, value: data.license.highest_issued_revision },
            { label: messages.deviceLimit, value: data.license.max_active_devices },
          ]} />
        </div>
      </details>
    </div>
  );
}
