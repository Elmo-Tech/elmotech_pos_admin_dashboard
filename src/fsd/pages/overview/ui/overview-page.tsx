import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  MonitorSmartphone,
  ShieldAlert,
  Upload,
  Clock3,
  UsersRound,
} from "lucide-react";
import { CreateCustomerDialog } from "@/features/create-customer";
import { CustomerGrowthChart, SubscriptionHealth } from "./dashboard-charts";
import { EmptyState } from "@/shared/ui/empty-state";
import { EntityLink } from "@/shared/ui/entity-link";
import { PageHeader } from "@/shared/ui/page-header";
import { ModuleErrorState } from "@/shared/ui/module-error-state";
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
    overviewDescription: `أهم المؤشرات التشغيلية المباشرة من ${environment === "production" ? messages.production : messages.staging}.`,
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
    overviewDescription: `The most important operating signals from ${environment === "production" ? messages.production : messages.staging}.`,
    activity: "Latest activity",
    activityDescription: "Recent activation requests and customers added to the system.",
  };

  let data;
  try {
    data = await getOverviewData();
  } catch {
    return <div className="flex flex-col gap-6"><PageHeader title={messages.navOverview} description={copy.description} /><ModuleErrorState title={messages.overviewUnavailable} locale={locale} /></div>;
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
      <PageHeader
        eyebrow={copy.eyebrow}
        title={locale === "ar" ? "نظرة شاملة. قرارات أوضح." : "A clear view. A better day."}
        description={locale === "ar" ? "عملاؤك، اشتراكاتك، وكل ما يحتاج متابعتك — في مكان واحد." : "Your customers, subscriptions, and everything that needs your attention — together."}
        actions={<>{canManage ? <CreateCustomerDialog locale={locale} /> : null}<Link href="/activation-requests" className="secondary-button"><Upload aria-hidden="true" size={16} />{copy.activation}</Link></>}
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="premium-panel flex flex-col justify-between p-6 sm:p-7">
          <div className="flex items-start justify-between gap-5">
            <div><span className="text-[11px] font-semibold text-indigo-200">{locale === "ar" ? "حالة مساحة العمل" : "WORKSPACE AT A GLANCE"}</span>
              <h2 className="mt-3 text-2xl font-semibold leading-relaxed">{attentionCount > 0 ? (locale === "ar" ? "فيه مهام محتاجة انتباهك." : "A few things need your attention.") : (locale === "ar" ? "كل شيء واضح. جاهز ليومك؟" : "All clear. Ready for the day?")}</h2>
              <p className="mt-2 max-w-lg text-xs leading-6 text-indigo-100/75">{locale === "ar" ? "ابدأ بطلبات التفعيل، ثم راجع الاشتراكات القريبة من الانتهاء." : "Start with activation requests, then review subscriptions approaching expiry."}</p>
            </div><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10"><CheckCircle2 size={22} aria-hidden="true" /></span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/15 pt-5">
            <HeroMetric label={copy.healthy} value={formatNumber(data.metrics.activeSubscriptions, locale)} />
            <HeroMetric label={copy.licenses} value={formatNumber(data.metrics.activeLicenses, locale)} />
            <HeroMetric label={copy.attention} value={formatNumber(attentionCount, locale)} emphasis={attentionCount > 0} />
          </div>
        </section>
        <section className="surface-card p-5 sm:p-6" aria-labelledby="attention-title">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 id="attention-title" className="text-sm font-bold">{locale === "ar" ? "قائمة المتابعة" : "Your attention queue"}</h2><span className="rounded-md bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--text-muted)]">{locale === "ar" ? "الأولوية الآن" : "PRIORITY"}</span></div>
          <div className="space-y-2">
            {[
              { title: messages.requestsAttention, value: data.metrics.activationRequestsRequiringAttention, href: "/activation-requests", icon: ShieldAlert, tone: "amber" },
              { title: locale === "ar" ? "تنتهي خلال 30 يوماً" : "Expiring within 30 days", value: data.metrics.expiringSoonSubscriptions, href: "/subscriptions?status=expiring", icon: Clock3, tone: "blue" },
              { title: locale === "ar" ? "اشتراكات منتهية" : "Expired subscriptions", value: data.metrics.expiredSubscriptions, href: "/subscriptions?status=expired", icon: CalendarClock, tone: "rose" },
            ].map(item => <Link key={item.href} href={item.href} className="attention-row"><span className={`stat-icon tone-${item.tone}`}><item.icon size={17} aria-hidden="true" /></span><span className="flex-1 text-xs font-medium">{item.title}</span><span className="technical-value text-sm font-bold">{formatNumber(item.value, locale)}</span><ChevronLeft size={15} aria-hidden="true" className="text-[var(--text-muted)] ltr:rotate-180" /></Link>)}
          </div>
        </section>
      </div>

      <PageSection title={copy.overview} description={copy.overviewDescription}>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
                  <li key={request.requestId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--secondary)]/50">
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
                  <li key={customer.id} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--secondary)]/50">
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
      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-indigo-100/75">{label}</p>
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
