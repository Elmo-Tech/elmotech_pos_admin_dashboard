import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CreditCard,
  KeyRound,
  Mail,
  MonitorCheck,
  Phone,
  UserRound,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Locale } from "@/i18n/messages";
import { formatDate, localizeTerm, statusTone } from "@/lib/format";

interface CustomerProfileHeaderProps {
  locale: Locale;
  customer: {
    business_name: string;
    customer_code: string;
    owner_name: string;
    email: string | null;
    phone: string;
    status: string;
    created_at: string;
  };
  planName: string | null;
  subscriptionStatus: string | null;
  totalLicenses: number;
  activeDevices: number;
}

export function CustomerProfileHeader({
  locale,
  customer,
  planName,
  subscriptionStatus,
  totalLicenses,
  activeDevices,
}: CustomerProfileHeaderProps) {
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const initial = customer.business_name.trim().charAt(0).toLocaleUpperCase(locale === "ar" ? "ar" : "en");

  return (
    <header className="premium-panel p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <Link
            href="/customers"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-100/85 hover:text-white"
          >
            <BackIcon aria-hidden="true" size={16} />
            {locale === "ar" ? "العودة إلى العملاء" : "Back to customers"}
          </Link>

          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-bold text-white shadow-inner sm:size-20 sm:text-3xl">
              {initial || <Building2 aria-hidden="true" size={30} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display-heading truncate text-3xl font-bold text-white sm:text-[2.35rem]">
                  {customer.business_name}
                </h1>
                <StatusBadge label={localizeTerm(customer.status, locale)} tone={statusTone(customer.status)} />
              </div>
              <p className="technical-value mt-2 font-mono text-xs text-blue-100/70">{customer.customer_code}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-50/80">
                <span className="inline-flex items-center gap-2"><UserRound aria-hidden="true" size={15} />{customer.owner_name}</span>
                {customer.email ? <span className="inline-flex items-center gap-2"><Mail aria-hidden="true" size={15} /><bdi>{customer.email}</bdi></span> : null}
                <span className="inline-flex items-center gap-2"><Phone aria-hidden="true" size={15} /><bdi>{customer.phone}</bdi></span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-white/12 bg-white/[0.075] p-4 backdrop-blur-sm sm:w-auto sm:min-w-64">
          <p className="text-xs font-semibold text-blue-100/65">{locale === "ar" ? "الخطة الحالية" : "Current plan"}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <p className="max-w-64 text-base font-bold leading-6 text-white">{planName ?? (locale === "ar" ? "لا يوجد اشتراك" : "No subscription")}</p>
              {subscriptionStatus ? <p className="mt-1 text-xs text-blue-100/70">{localizeTerm(subscriptionStatus, locale)}</p> : null}
            </div>
            <CreditCard aria-hidden="true" className="shrink-0 text-blue-200" size={21} />
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
        <HeaderMetric icon={KeyRound} label={locale === "ar" ? "التراخيص" : "Licenses"} value={String(totalLicenses)} />
        <HeaderMetric icon={MonitorCheck} label={locale === "ar" ? "الأجهزة النشطة" : "Active devices"} value={String(activeDevices)} />
        <HeaderMetric icon={CalendarDays} label={locale === "ar" ? "عميل منذ" : "Customer since"} value={formatDate(customer.created_at, locale)} />
      </div>
    </header>
  );
}

function HeaderMetric({ icon: Icon, label, value }: { icon: typeof KeyRound; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#101b34]/80 px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
        <Icon aria-hidden="true" size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-blue-100/60">{label}</p>
        <p className="technical-value truncate text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
