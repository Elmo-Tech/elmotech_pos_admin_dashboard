import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DetailGrid } from "@/components/ui/detail-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { SectionNav } from "@/components/ui/section-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddSubscriptionForm } from "@/components/commercial/commercial-forms";
import { SubscriptionSummary } from "@/components/commercial/subscription-summary";
import { RenewSubscription } from "@/components/commercial/renew-subscription";
import { getCustomerDetail } from "@/features/customers/server/queries";
import { shortId } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDate, formatDateTime, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { canManageCommercialRecords } from "@/types/rbac";

type Detail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;
type Subscription = Detail["subscriptions"][number];
type License = Detail["licenses"][number];
type Device = Detail["devices"][number];
type RequestRow = Detail["requests"][number];
type Issuance = Detail["issuances"][number];
type Audit = Detail["audit"][number];

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const { customerId } = await params;
  const access = await requireAdminAccess();
  const canManage = access.authorized && canManageCommercialRecords(access.context.role);
  let data: Detail | null;
  try {
    data = await getCustomerDetail(customerId);
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.customerOverview} description={messages.customerDetailsDescription} /><ModuleErrorState title={messages.customerDetailsLoadError} locale={locale} /></div>;
  }
  if (!data) notFound();

  const currentSubscription = data.subscriptions.find((row) => row.status === "active") ?? data.subscriptions[0] ?? null;
  const currentLicense = currentSubscription
    ? data.licenses.find((row) => row.subscription_id === currentSubscription.id && ["active", "expired"].includes(row.status))
      ?? data.licenses.find((row) => row.subscription_id === currentSubscription.id)
      ?? null
    : null;
  const activeDevices = data.devices.filter((row) => row.status === "active").length;
  const currentLicenseDevices = currentLicense
    ? data.devices.filter((row) => row.license_id === currentLicense.id)
    : [];
  const currentActiveDevices = currentLicenseDevices.filter((row) => row.status === "active").length;
  const renewalBaseEligible = Boolean(
    currentSubscription &&
    currentLicense &&
    data.customer.status === "active" &&
    ["active", "expired"].includes(currentSubscription.status) &&
    ["active", "expired"].includes(currentLicense.status) &&
    currentLicense.highest_issued_revision >= 1,
  );
  const renewalUnavailableReason = !renewalBaseEligible
    ? "notEligible" as const
    : currentActiveDevices === 1
      ? "none" as const
      : currentLicenseDevices.length > 0
        ? "replacement" as const
        : "noDevice" as const;
  const canProvision = !data.subscriptions.some((row) => ["draft", "active", "suspended"].includes(row.status));
  const empty = (title: string) => <EmptyState title={title} description={messages.noRelatedRecords} />;

  const subscriptionColumns: DataTableColumn<Subscription>[] = [
    { key: "plan", header: messages.plan, render: (row) => row.plan?.name ?? row.plan_name_snapshot },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "start", header: messages.start, render: (row) => formatDate(row.starts_at, locale) },
    { key: "expiry", header: messages.expiration, render: (row) => row.is_lifetime ? messages.lifetime : formatDate(row.expires_at, locale) },
  ];
  const licenseColumns: DataTableColumn<License>[] = [
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.id}`} label={locale === "ar" ? `ترخيص — ${data.customer.business_name}` : `License — ${data.customer.business_name}`} /> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "revision", header: messages.revision, render: (row) => row.highest_issued_revision },
    { key: "created", header: messages.created, render: (row) => formatDate(row.created_at, locale) },
  ];
  const deviceColumns: DataTableColumn<Device>[] = [
    { key: "device", header: messages.device, render: (row) => <span className="technical-value font-mono text-xs">{shortId(row.id)}</span> },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={shortId(row.license_id)} /> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "activated", header: messages.activated, render: (row) => formatDateTime(row.activated_at, locale) },
  ];
  const requestColumns: DataTableColumn<RequestRow>[] = [
    { key: "request", header: messages.request, render: (row) => <span className="technical-value font-mono text-xs">{shortId(row.request_id)}</span> },
    { key: "status", header: messages.status, render: (row) => <StatusBadge label={localizeTerm(row.status, locale)} tone={statusTone(row.status)} /> },
    { key: "app", header: messages.appVersion, render: (row) => <span className="technical-value">{row.app_version}</span> },
    { key: "received", header: messages.received, render: (row) => formatDateTime(row.received_at, locale) },
  ];
  const issuanceColumns: DataTableColumn<Issuance>[] = [
    { key: "revision", header: messages.revision, render: (row) => row.revision },
    { key: "license", header: messages.license, render: (row) => <EntityLink href={`/licenses/${row.license_id}`} label={shortId(row.license_id)} /> },
    { key: "reason", header: messages.reason, render: (row) => localizeTerm(row.reason, locale) },
    { key: "issued", header: messages.issued, render: (row) => formatDateTime(row.issued_at, locale) },
  ];
  const auditColumns: DataTableColumn<Audit>[] = [
    { key: "time", header: messages.timestamp, render: (row) => formatDateTime(row.created_at, locale) },
    { key: "action", header: messages.action, render: (row) => localizeTerm(row.action, locale) },
    { key: "target", header: messages.related, render: (row) => row.license_id ? <EntityLink href={`/licenses/${row.license_id}`} label={`${messages.license} ${shortId(row.license_id)}`} /> : messages.customer },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={data.customer.business_name}
        description={messages.customerDetailsDescription}
        actions={<Link href="/customers" className="text-sm font-semibold text-blue-700 hover:underline">{messages.backToCustomers}</Link>}
      />
      <SectionNav ariaLabel={messages.pageSections} items={[
        { href: "#overview", label: messages.overviewTitle },
        { href: "#subscription", label: messages.subscription },
        { href: "#licensing", label: messages.licensing },
        { href: "#history", label: messages.history },
      ]} />

      <div id="overview">
        <PageSection title={messages.details}>
          <DetailGrid items={[
            { label: messages.status, value: <StatusBadge label={localizeTerm(data.customer.status, locale)} tone={statusTone(data.customer.status)} /> },
            { label: messages.owner, value: data.customer.owner_name },
            { label: messages.email, value: <bdi>{data.customer.email ?? "—"}</bdi> },
            { label: messages.phone, value: <bdi>{data.customer.phone}</bdi> },
            { label: messages.address, value: data.customer.address ?? "—" },
            { label: messages.created, value: formatDate(data.customer.created_at, locale) },
            { label: messages.plan, value: currentSubscription?.plan?.name ?? currentSubscription?.plan_name_snapshot ?? "—" },
            { label: messages.subscription, value: currentSubscription ? <StatusBadge label={localizeTerm(currentSubscription.status, locale)} tone={statusTone(currentSubscription.status)} /> : "—" },
            { label: messages.validity, value: currentSubscription?.is_lifetime ? messages.lifetime : formatDate(currentSubscription?.expires_at ?? null, locale) },
            { label: messages.totalLicenses, value: data.licenses.length },
            { label: messages.activeDevices, value: activeDevices },
            { label: messages.licenseStatus, value: currentLicense ? <StatusBadge label={localizeTerm(currentLicense.status, locale)} tone={statusTone(currentLicense.status)} /> : "—" },
          ]} />
        </PageSection>
      </div>

      <div id="subscription">
        <PageSection title={messages.subscription}>
          {currentSubscription ? <SubscriptionSummary subscription={currentSubscription} locale={locale} referenceNow={data.referenceNow} /> : null}
          {canManage && currentSubscription && currentLicense ? (
            <RenewSubscription
              locale={locale}
              subscription={currentSubscription}
              licenseId={currentLicense.id}
              plans={data.enabledPlans}
              referenceNow={data.referenceNow}
              unavailableReason={renewalUnavailableReason}
            />
          ) : null}
          {canManage && data.enabledPlans.length > 0 ? (
            <div className="mb-5">
              <AddSubscriptionForm locale={locale} customerId={data.customer.id} plans={data.enabledPlans} canProvision={canProvision} />
            </div>
          ) : null}
          <DataTable columns={subscriptionColumns} rows={data.subscriptions} getRowKey={(row) => row.id} emptyState={empty(messages.noSubscriptions)} />
        </PageSection>
      </div>

      <div id="licensing" className="flex flex-col gap-6">
        <PageSection title={messages.licenses}>
          <DataTable columns={licenseColumns} rows={data.licenses} getRowKey={(row) => row.id} emptyState={empty(messages.noLicenses)} />
        </PageSection>
        <PageSection title={messages.currentDevice}>
          <DataTable columns={deviceColumns} rows={data.devices} getRowKey={(row) => row.id} emptyState={empty(messages.noDevices)} />
        </PageSection>
      </div>

      <div id="history">
        <PageSection title={messages.activationHistory}>
          <DataTable columns={requestColumns} rows={data.requests} getRowKey={(row) => row.request_id} emptyState={empty(messages.noActivationRequests)} />
        </PageSection>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-800">
          {messages.technicalDetails}
        </summary>
        <div className="flex flex-col gap-6 border-t border-slate-200 p-5">
          <p className="text-sm text-slate-500">{messages.technicalDetailsDescription}</p>
          <DetailGrid items={[
            { label: messages.customerCode, value: <span className="technical-value font-mono text-xs">{data.customer.customer_code}</span> },
            { label: messages.customerLabel, value: <span className="technical-value font-mono text-xs">{data.customer.id}</span> },
            { label: messages.taxId, value: <bdi>{data.customer.tax_id ?? "—"}</bdi> },
            { label: messages.notes, value: data.customer.notes ?? "—" },
          ]} />
          <PageSection title={messages.issuancesTitle}>
            <DataTable columns={issuanceColumns} rows={data.issuances} getRowKey={(row) => row.id} emptyState={empty(messages.noIssuances)} />
          </PageSection>
          <PageSection title={messages.auditLogsTitle}>
            <DataTable columns={auditColumns} rows={data.audit} getRowKey={(row) => row.id} emptyState={empty(messages.noAuditHistory)} />
          </PageSection>
        </div>
      </details>
    </div>
  );
}
