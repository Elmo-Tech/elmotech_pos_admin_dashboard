import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CircleCheckBig,
  FileClock,
  KeyRound,
  Mail,
  MapPin,
  NotebookText,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AddSubscriptionDialog } from "@/components/commercial/commercial-forms";
import { RenewSubscription } from "@/components/commercial/renew-subscription";
import { SubscriptionSummary } from "@/components/commercial/subscription-summary";
import { CustomerProfileHeader } from "@/components/customers/customer-profile-header";
import { CustomerProfileTabs } from "@/components/customers/customer-profile-tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { ModuleErrorState } from "@/components/ui/module-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCustomerDetail } from "@/features/customers/server/queries";
import { shortId } from "@/features/shared/server/query-helpers";
import { getMessages, type Locale } from "@/i18n/messages";
import { formatDate, formatDateTime, localizeTerm, statusTone } from "@/lib/format";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { getServerEnvironment } from "@/server/env";
import { getLocale } from "@/server/i18n/get-locale";
import { canManageCommercialRecords } from "@/types/rbac";

type Detail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;
type Subscription = Detail["subscriptions"][number];
type License = Detail["licenses"][number];
type Device = Detail["devices"][number];
type RequestRow = Detail["requests"][number];
type Issuance = Detail["issuances"][number];
type Audit = Detail["audit"][number];

const PROFILE_COPY = {
  en: {
    overview: "Overview",
    subscription: "Subscription",
    licensing: "Licenses & devices",
    history: "Activity",
    accountInfo: "Account information",
    accountInfoDescription: "The customer identity and contact details used by the licensing team.",
    operationalState: "Operational state",
    operationalStateDescription: "A concise view of this account's licensing health.",
    currentPlan: "Current plan",
    licenseState: "License state",
    activeDevices: "Active devices",
    activationRequests: "Activation requests",
    subscriptionWorkspace: "Subscription management",
    subscriptionWorkspaceDescription: "Review the current entitlement, renew it, or create the first subscription.",
    subscriptionHistory: "Subscription history",
    subscriptionHistoryDescription: "Every commercial period assigned to this customer.",
    licensingWorkspace: "Licensing workspace",
    licensingWorkspaceDescription: "Current license records and the devices activated against them.",
    currentLicense: "Current license",
    noCurrentLicense: "No current license",
    licenseRecords: "License records",
    devices: "Devices",
    activityWorkspace: "Account activity",
    activityWorkspaceDescription: "Activation requests, file issuances, and immutable audit history.",
    internalRecord: "Internal record",
    internalRecordDescription: "Identifiers and notes for support use. No plaintext key material is displayed.",
    healthy: "Account is active and ready for licensing operations.",
    attention: "This account requires attention before licensing operations.",
    customerId: "Customer ID",
  },
  ar: {
    overview: "نظرة عامة",
    subscription: "الاشتراك",
    licensing: "التراخيص والأجهزة",
    history: "النشاط",
    accountInfo: "بيانات الحساب",
    accountInfoDescription: "هوية العميل وبيانات التواصل التي يعتمد عليها فريق التراخيص.",
    operationalState: "الحالة التشغيلية",
    operationalStateDescription: "ملخص مباشر لصحة حساب العميل وعمليات الترخيص.",
    currentPlan: "الخطة الحالية",
    licenseState: "حالة الترخيص",
    activeDevices: "الأجهزة النشطة",
    activationRequests: "طلبات التفعيل",
    subscriptionWorkspace: "إدارة الاشتراك",
    subscriptionWorkspaceDescription: "راجع الاستحقاق الحالي أو جدّده أو أنشئ أول اشتراك للعميل.",
    subscriptionHistory: "سجل الاشتراكات",
    subscriptionHistoryDescription: "كل فترات الاشتراك التي تم إسنادها لهذا العميل.",
    licensingWorkspace: "مساحة التراخيص",
    licensingWorkspaceDescription: "سجلات التراخيص الحالية والأجهزة التي تم تفعيلها عليها.",
    currentLicense: "الترخيص الحالي",
    noCurrentLicense: "لا يوجد ترخيص حالي",
    licenseRecords: "سجلات التراخيص",
    devices: "الأجهزة",
    activityWorkspace: "نشاط الحساب",
    activityWorkspaceDescription: "طلبات التفعيل وإصدارات الملفات وسجل التدقيق غير القابل للتعديل.",
    internalRecord: "البيانات الداخلية",
    internalRecordDescription: "معرّفات وملاحظات مخصصة للدعم. لا يتم عرض أي مفاتيح ترخيص بنص واضح.",
    healthy: "الحساب نشط وجاهز لعمليات الترخيص.",
    attention: "يحتاج هذا الحساب إلى المراجعة قبل تنفيذ عمليات الترخيص.",
    customerId: "معرّف العميل",
  },
} as const;

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const t = PROFILE_COPY[locale];
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
  const currentLicenseDevices = currentLicense ? data.devices.filter((row) => row.license_id === currentLicense.id) : [];
  const currentActiveDevices = currentLicenseDevices.filter((row) => row.status === "active").length;
  const renewalBaseEligible = Boolean(
    currentSubscription
    && currentLicense
    && data.customer.status === "active"
    && ["active", "expired"].includes(currentSubscription.status)
    && ["active", "expired"].includes(currentLicense.status)
    && currentLicense.highest_issued_revision >= 1,
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

  const overviewPanel = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
      <section className="surface-card overflow-hidden">
        <SectionHeading icon={Building2} title={t.accountInfo} description={t.accountInfoDescription} />
        <div className="grid sm:grid-cols-2">
          <InfoCell icon={UserRound} label={messages.owner} value={data.customer.owner_name} />
          <InfoCell icon={Mail} label={messages.email} value={<bdi>{data.customer.email ?? "—"}</bdi>} />
          <InfoCell icon={Phone} label={messages.phone} value={<bdi>{data.customer.phone}</bdi>} />
          <InfoCell icon={MapPin} label={messages.address} value={data.customer.address ?? "—"} />
          <InfoCell icon={ShieldCheck} label={messages.taxId} value={<bdi>{data.customer.tax_id ?? "—"}</bdi>} />
          <InfoCell icon={NotebookText} label={messages.notes} value={data.customer.notes ?? "—"} />
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <SectionHeading icon={CircleCheckBig} title={t.operationalState} description={t.operationalStateDescription} />
        <div className="space-y-1 p-3">
          <HealthRow label={messages.customerStatus} value={<StatusBadge label={localizeTerm(data.customer.status, locale)} tone={statusTone(data.customer.status)} />} />
          <HealthRow label={t.currentPlan} value={currentSubscription?.plan?.name ?? currentSubscription?.plan_name_snapshot ?? "—"} />
          <HealthRow label={t.licenseState} value={currentLicense ? <StatusBadge label={localizeTerm(currentLicense.status, locale)} tone={statusTone(currentLicense.status)} /> : "—"} />
          <HealthRow label={t.activeDevices} value={String(activeDevices)} />
          <HealthRow label={t.activationRequests} value={String(data.requests.length)} />
        </div>
        <div className={`m-4 mt-1 flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${data.customer.status === "active" ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--warning-soft)] text-[var(--warning)]"}`}>
          {data.customer.status === "active" ? <CircleCheckBig aria-hidden="true" className="mt-0.5 shrink-0" size={17} /> : <FileClock aria-hidden="true" className="mt-0.5 shrink-0" size={17} />}
          <span>{data.customer.status === "active" ? t.healthy : t.attention}</span>
        </div>
      </section>
    </div>
  );

  const subscriptionPanel = (
    <div className="flex flex-col gap-8">
      <PageSection
        title={t.subscriptionWorkspace}
        description={t.subscriptionWorkspaceDescription}
        actions={canManage && data.enabledPlans.length > 0 ? <AddSubscriptionDialog locale={locale} customerId={data.customer.id} plans={data.enabledPlans} canProvision={canProvision} /> : undefined}
      >
        {currentSubscription ? <SubscriptionSummary subscription={currentSubscription} locale={locale} referenceNow={data.referenceNow} /> : empty(messages.noSubscriptions)}
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
      </PageSection>
      <PageSection title={t.subscriptionHistory} description={t.subscriptionHistoryDescription}>
        <DataTable columns={subscriptionColumns} rows={data.subscriptions} getRowKey={(row) => row.id} emptyState={empty(messages.noSubscriptions)} />
      </PageSection>
    </div>
  );

  const licensingPanel = (
    <div className="flex flex-col gap-8">
      <PageSection title={t.licensingWorkspace} description={t.licensingWorkspaceDescription}>
        <CurrentLicenseCard license={currentLicense} customerName={data.customer.business_name} locale={locale} emptyLabel={t.noCurrentLicense} />
      </PageSection>
      <PageSection title={t.licenseRecords}>
        <DataTable columns={licenseColumns} rows={data.licenses} getRowKey={(row) => row.id} emptyState={empty(messages.noLicenses)} />
      </PageSection>
      <PageSection title={t.devices}>
        <DataTable columns={deviceColumns} rows={data.devices} getRowKey={(row) => row.id} emptyState={empty(messages.noDevices)} />
      </PageSection>
    </div>
  );

  const historyPanel = (
    <div className="flex flex-col gap-8">
      <PageSection title={t.activityWorkspace} description={t.activityWorkspaceDescription}>
        <DataTable columns={requestColumns} rows={data.requests} getRowKey={(row) => row.request_id} emptyState={empty(messages.noActivationRequests)} />
      </PageSection>
      <PageSection title={messages.issuancesTitle}>
        <DataTable columns={issuanceColumns} rows={data.issuances} getRowKey={(row) => row.id} emptyState={empty(messages.noIssuances)} />
      </PageSection>
      <PageSection title={messages.auditLogsTitle}>
        <DataTable columns={auditColumns} rows={data.audit} getRowKey={(row) => row.id} emptyState={empty(messages.noAuditHistory)} />
      </PageSection>
      <details className="surface-card overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-[var(--text)]">{t.internalRecord}</summary>
        <div className="border-t border-[var(--border)] p-5">
          <p className="mb-5 text-sm text-[var(--text-muted)]">{t.internalRecordDescription}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <InternalValue label={messages.customerCode} value={data.customer.customer_code} />
            <InternalValue label={t.customerId} value={data.customer.id} />
          </div>
        </div>
      </details>
    </div>
  );

  return (
    <div className="flex flex-col gap-7">
      <CustomerProfileHeader
        locale={locale}
        customer={data.customer}
        planName={currentSubscription?.plan?.name ?? currentSubscription?.plan_name_snapshot ?? null}
        subscriptionStatus={currentSubscription?.status ?? null}
        totalLicenses={data.licenses.length}
        activeDevices={activeDevices}
      />
      <CustomerProfileTabs
        locale={locale}
        labels={{ overview: t.overview, subscription: t.subscription, licensing: t.licensing, history: t.history }}
        overview={overviewPanel}
        subscription={subscriptionPanel}
        licensing={licensingPanel}
        history={historyPanel}
      />
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Building2; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] bg-slate-50/70 p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon aria-hidden="true" size={19} /></span>
      <div><h2 className="font-bold text-[var(--text)]">{title}</h2><p className="mt-0.5 text-sm leading-6 text-[var(--text-muted)]">{description}</p></div>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-24 items-start gap-3 border-b border-[var(--border)] p-5 sm:even:border-s sm:[&:nth-last-child(-n+2)]:border-b-0">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" size={17} />
      <div className="min-w-0"><p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p><div className="mt-1 break-words font-semibold leading-6 text-[var(--text)]">{value}</div></div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl px-3 py-2.5 hover:bg-slate-50"><span className="text-sm text-[var(--text-muted)]">{label}</span><span className="text-end text-sm font-bold text-[var(--text)]">{value}</span></div>;
}

function CurrentLicenseCard({ license, customerName, locale, emptyLabel }: { license: License | null; customerName: string; locale: Locale; emptyLabel: string }) {
  if (!license) return <EmptyState title={emptyLabel} description={locale === "ar" ? "أنشئ اشتراكًا أولاً لإصدار ترخيص لهذا العميل." : "Create a subscription first to issue a license for this customer."} />;
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-5 border-blue-100 bg-[linear-gradient(135deg,#fff_0%,#f6f9ff_100%)] p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--sh-primary)]"><KeyRound aria-hidden="true" size={21} /></span>
        <div className="min-w-0"><p className="text-xs font-semibold text-[var(--text-muted)]">{locale === "ar" ? "الترخيص الحالي" : "Current license"}</p><p className="mt-1 truncate font-bold text-[var(--text)]">{locale === "ar" ? `ترخيص — ${customerName}` : `License — ${customerName}`}</p><p className="technical-value mt-1 font-mono text-xs text-[var(--text-muted)]">{shortId(license.id)}</p></div>
      </div>
      <div className="flex items-center gap-3"><StatusBadge label={localizeTerm(license.status, locale)} tone={statusTone(license.status)} /><Link href={`/licenses/${license.id}`} className="secondary-button">{locale === "ar" ? "فتح الترخيص" : "Open license"}</Link></div>
    </div>
  );
}

function InternalValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--muted)] px-4 py-3"><p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p><p className="technical-value mt-1 overflow-hidden text-ellipsis font-mono text-xs text-[var(--text)]">{value}</p></div>;
}
