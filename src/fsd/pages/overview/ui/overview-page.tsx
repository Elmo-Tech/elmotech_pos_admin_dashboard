import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CircleGauge,
  MonitorSmartphone,
  ShieldAlert,
  Sparkles,
  Upload,
  UsersRound,
} from "lucide-react";
import { CreateCustomerDialog } from "@/features/create-customer";
import { CustomerGrowthChart, SubscriptionHealth } from "./dashboard-charts";
import { EmptyState } from "@/shared/ui/empty-state";
import { EntityLink } from "@/shared/ui/entity-link";
import { PageSection } from "@/shared/ui/page-section";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusBadge } from "@/shared/ui/status-badge";
import { getOverviewData } from "../api/get-overview-data";
import { shortId } from "@/shared/lib/query-helpers";
import { getMessages } from "@/shared/i18n";
import { formatDate, formatDateTime, formatNumber, localizeTerm, statusTone } from "@/shared/lib/format";
import { requireAdminAccess } from "@/entities/session/server";
import { getServerEnvironment } from "@/shared/config/server";
import { getLocale } from "@/shared/i18n/server";
import { canManageCommercialRecords } from "@/entities/session";

export async function OverviewPage() {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const access = await requireAdminAccess();
  const canManage = access.authorized && canManageCommercialRecords(access.context.role);
  const copy = locale === "ar" ? {
    eyebrow: "مركز قيادة التراخيص",
    heading: "كل ما يحتاج انتباهك، في نظرة واحدة.",
    description: "تابع نمو العملاء وصحة الاشتراكات ودورة التفعيل من لوحة تشغيل واحدة مصممة لاتخاذ القرار بسرعة.",
    activation: "معالجة طلب تفعيل",
    pulse: "نبض التشغيل",
    healthy: "الاشتراكات النشطة",
    licenses: "تراخيص فعّالة",
    attention: "عناصر تحتاج متابعة",
    overview: "ملخص الأداء",
    overviewDescription: "أهم المؤشرات التشغيلية المباشرة من بيئة الإنتاج.",
    activity: "آخر النشاطات",
    activityDescription: "أحدث طلبات التفعيل والعملاء المضافين إلى النظام.",
  } : {
    eyebrow: "Licensing command center",
    heading: "Everything that needs your attention, at a glance.",
    description: "Track customer growth, subscription health, and activation flow from one decision-ready workspace.",
    activation: "Process activation",
    pulse: "Operational pulse",
    healthy: "Active subscriptions",
    licenses: "Active licenses",
    attention: "Items requiring attention",
    overview: "Performance overview",
    overviewDescription: "The most important live operating signals from Production.",
    activity: "Latest activity",
    activityDescription: "Recent activation requests and customers added to the system.",
  };

  let data;
  try {
    data = await getOverviewData();
  } catch {
    return (
      <div className="surface-card border-red-200 px-6 py-16 text-center">
        <p className="text-base font-semibold text-[var(--text)]">{messages.overviewUnavailable}</p>
        <p className="mx-auto mt-1.5 max-w-lg text-sm text-[var(--text-muted)]">{messages.overviewUnavailableDescription}</p>
      </div>
    );
  }

  const metrics = [
    { label: messages.totalCustomers, value: data.metrics.customers, hint: messages.allCustomerRecords, href: "/customers", icon: UsersRound, tone: "blue" as const },
    { label: messages.activeSubscriptions, value: data.metrics.activeSubscriptions, hint: messages.currentlyValid, href: "/subscriptions?status=active", icon: CalendarClock, tone: "emerald" as const },
    { label: locale === "ar" ? "الأجهزة الفعّالة" : "Active devices", value: data.metrics.activeDevices, hint: locale === "ar" ? "أجهزة مرتبطة بتراخيص حالية" : "Devices linked to current licenses", href: "/devices?status=active", icon: MonitorSmartphone, tone: "violet" as const },
    { label: messages.requestsAttention, value: data.metrics.activationRequestsRequiringAttention, hint: messages.pendingOrValidated, href: "/activation-requests", icon: ShieldAlert, tone: "amber" as const },
  ];
  const attentionCount = data.metrics.activationRequestsRequiringAttention + data.metrics.expiringSoonSubscriptions + data.metrics.expiredSubscriptions;
  const growth = data.customerGrowth.map((point) => ({
    label: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { month: "short" }).format(new Date(point.month)),
    value: point.count,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="premium-panel animate-fade-up px-6 py-7 sm:px-8 sm:py-9 lg:px-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-[11px] font-bold text-blue-100">
              <Sparkles aria-hidden="true" size={14} />{copy.eyebrow}
            </span>
            <h1 className="display-heading mt-5 max-w-2xl text-[32px] font-bold leading-[1.2] text-white sm:text-[42px]">{copy.heading}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{copy.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {canManage ? <CreateCustomerDialog locale={locale} /> : null}
              <Link href="/activation-requests" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.14]">
                <Upload aria-hidden="true" size={17} />{copy.activation}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-200">{copy.pulse}</p>
                <p className="mt-1 text-sm text-slate-400">{environment === "production" ? messages.production : messages.staging}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-blue-500/20 text-blue-200"><CircleGauge aria-hidden="true" size={20} /></span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              <HeroMetric label={copy.healthy} value={formatNumber(data.metrics.activeSubscriptions, locale)} />
              <HeroMetric label={copy.licenses} value={formatNumber(data.metrics.activeLicenses, locale)} />
              <HeroMetric label={copy.attention} value={formatNumber(attentionCount, locale)} emphasis={attentionCount > 0} />
            </div>
          </div>
        </div>
      </section>

      <PageSection title={copy.overview} description={copy.overviewDescription}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="animate-fade-up" style={{ animationDelay: `${80 + index * 70}ms` }}>
              <StatCard {...metric} value={formatNumber(metric.value, locale)} />
            </div>
          ))}
        </div>
      </PageSection>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <CustomerGrowthChart data={growth} locale={locale} />
        <SubscriptionHealth
          active={data.metrics.activeSubscriptions}
          expiring={data.metrics.expiringSoonSubscriptions}
          expired={data.metrics.expiredSubscriptions}
          total={data.metrics.totalSubscriptions}
          locale={locale}
        />
      </div>

      <PageSection title={copy.activity} description={copy.activityDescription}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ActivityCard title={messages.recentRequests} href="/activation-requests" linkLabel={messages.viewAllRequests}>
            {data.recentActivationRequests.length === 0 ? (
              <EmptyState title={messages.noRequestsYet} description={messages.noRequestsYetDescription} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.recentActivationRequests.slice(0, 5).map((request) => (
                  <li key={request.requestId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-blue-50/40">
                    <div className="min-w-0">
                      {request.customer ? <EntityLink href={`/customers/${request.customer.id}`} label={request.customer.businessName} sublabel={request.customer.customerCode} /> : <span className="technical-value font-mono text-xs">{shortId(request.licenseId)}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge label={localizeTerm(request.status, locale)} tone={statusTone(request.status)} />
                      <time className="text-xs text-[var(--text-muted)]" dateTime={request.receivedAt}>{formatDateTime(request.receivedAt, locale)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ActivityCard>

          <ActivityCard title={messages.recentCustomers} href="/customers" linkLabel={messages.viewAllCustomers}>
            {data.recentCustomers.length === 0 ? (
              <EmptyState title={messages.noCustomersYet} description={messages.noCustomersYetDescription} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.recentCustomers.slice(0, 5).map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-blue-50/40">
                    <EntityLink href={`/customers/${customer.id}`} label={customer.businessName} sublabel={customer.customerCode} />
                    <div className="text-end">
                      <StatusBadge label={localizeTerm(customer.status, locale)} tone={statusTone(customer.status)} />
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(customer.createdAt, locale)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ActivityCard>
        </div>
      </PageSection>
    </div>
  );
}

function HeroMetric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0 text-center">
      <p className={`technical-value text-xl font-bold sm:text-2xl ${emphasis ? "text-amber-300" : "text-white"}`}>{value}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">{label}</p>
    </div>
  );
}

function ActivityCard({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="surface-card overflow-hidden border-white/80 shadow-[var(--sh-lg)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-slate-50/70 px-5 py-4">
        <h3 className="font-bold text-[var(--text)]">{title}</h3>
        <Link href={href} className="group inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
          {linkLabel}<ArrowUpRight aria-hidden="true" size={14} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-rotate-90" />
        </Link>
      </div>
      {children}
    </section>
  );
}
