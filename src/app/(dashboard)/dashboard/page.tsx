import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityLink } from "@/components/ui/entity-link";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOverviewData } from "@/features/overview/server/get-overview-data";
import { shortId } from "@/features/shared/server/query-helpers";
import { getMessages } from "@/i18n/messages";
import { formatDate, formatDateTime, formatNumber, localizeTerm, statusTone } from "@/lib/format";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

export default async function OverviewPage() {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  let data;
  try {
    data = await getOverviewData();
  } catch {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={messages.overviewTitle} description={messages.overviewDescription} />
        <div className="surface-card border-red-200 px-6 py-12 text-center">
          <p className="text-base font-semibold text-[var(--text)]">{messages.overviewUnavailable}</p>
          <p className="mx-auto mt-1.5 max-w-lg text-sm text-[var(--text-muted)]">
            {messages.overviewUnavailableDescription}
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: messages.totalCustomers, value: data.metrics.customers, hint: messages.allCustomerRecords, href: "/customers" },
    { label: messages.activeSubscriptions, value: data.metrics.activeSubscriptions, hint: messages.currentlyValid, href: "/subscriptions?status=active" },
    { label: messages.expiringSoon, value: data.metrics.expiringSoonSubscriptions, hint: messages.nextThirtyDays, href: "/subscriptions?status=expiring" },
    { label: messages.expiredSubscriptions, value: data.metrics.expiredSubscriptions, hint: messages.statusExpired, href: "/subscriptions?status=expired" },
    { label: messages.requestsAttention, value: data.metrics.activationRequestsRequiringAttention, hint: messages.pendingOrValidated, href: "/activation-requests" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={messages.overviewTitle} description={messages.overviewDescription} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={formatNumber(metric.value, locale)}
            hint={metric.hint}
            href={metric.href}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection
          title={messages.recentRequests}
          actions={<Link href="/activation-requests" className="text-sm font-semibold text-[var(--primary)] hover:underline">{messages.viewAllRequests}</Link>}
        >
          <div className="surface-card overflow-hidden">
            {data.recentActivationRequests.length === 0 ? (
              <EmptyState title={messages.noRequestsYet} description={messages.noRequestsYetDescription} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.recentActivationRequests.map((request) => (
                  <li key={request.requestId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--bg)]">
                    <div className="min-w-0">
                      {request.customer ? (
                        <EntityLink
                          href={`/customers/${request.customer.id}`}
                          label={request.customer.businessName}
                          sublabel={request.customer.customerCode}
                        />
                      ) : (
                        <span className="technical-value font-mono text-xs">{shortId(request.licenseId)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge label={localizeTerm(request.status, locale)} tone={statusTone(request.status)} />
                      <time className="text-xs text-[var(--text-muted)]" dateTime={request.receivedAt}>
                        {formatDateTime(request.receivedAt, locale)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PageSection>

        <PageSection
          title={messages.recentCustomers}
          actions={<Link href="/customers" className="text-sm font-semibold text-[var(--primary)] hover:underline">{messages.viewAllCustomers}</Link>}
        >
          <div className="surface-card overflow-hidden">
            {data.recentCustomers.length === 0 ? (
              <EmptyState title={messages.noCustomersYet} description={messages.noCustomersYetDescription} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.recentCustomers.map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--bg)]">
                    <EntityLink href={`/customers/${customer.id}`} label={customer.businessName} sublabel={customer.customerCode} />
                    <div className="text-end">
                      <StatusBadge label={localizeTerm(customer.status, locale)} tone={statusTone(customer.status)} />
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(customer.createdAt, locale)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PageSection>
      </div>
    </div>
  );
}
