import "server-only";
import { BadgeCheck, Eye, KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { EnvironmentBadge } from "@/shared/ui/environment-badge";
import { requireAdminAccess } from "@/entities/session/server";
import { canManageCommercialRecords, canOperateLicenses } from "@/entities/session";
import { getMessages } from "@/shared/i18n";
import { getServerEnvironment } from "@/shared/config/server";
import { getLocale } from "@/shared/i18n/server";

export async function SettingsPage() {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const access = await requireAdminAccess();
  const ar = locale === "ar";
  const role = access.authorized ? access.context.role : null;
  const capabilities = [
    { icon: Eye, label: ar ? "استعراض البيانات والسجلات" : "View records and activity", allowed: access.authorized },
    { icon: KeyRound, label: ar ? "عمليات التفعيل والتراخيص" : "Activation and license operations", allowed: role !== null && canOperateLicenses(role) },
    { icon: BadgeCheck, label: ar ? "إدارة العملاء والخطط والاشتراكات" : "Manage customers, plans, and subscriptions", allowed: role !== null && canManageCommercialRecords(role) },
  ];
  return <div className="flex flex-col gap-7">
    <PageHeader eyebrow={ar ? "مساحة العمل" : "Your workspace"} title={messages.settingsTitle} description={messages.settingsDescription} />
    <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <section className="surface-card p-6"><span className="stat-icon tone-blue mb-5"><ShieldCheck size={20} aria-hidden="true" /></span><h2 className="text-base font-semibold">{ar ? "حسابك ومساحة عملك" : "Your account & workspace"}</h2>
        <dl className="mt-5 divide-y"><div className="py-3"><dt className="text-xs text-[var(--text-muted)]">{messages.email}</dt><dd className="mt-1 break-all text-sm font-semibold"><bdi>{access.authorized ? access.context.email : "—"}</bdi></dd></div><div className="flex items-center justify-between gap-3 py-3"><dt className="text-xs text-[var(--text-muted)]">{ar ? "الدور" : "Role"}</dt><dd className="rounded-lg bg-[var(--secondary)] px-3 py-1 text-xs font-semibold">{role ? {owner:messages.roleOwner,admin:messages.roleAdmin,support:messages.roleSupport,viewer:messages.roleViewer}[role] : "—"}</dd></div><div className="flex items-center justify-between gap-3 py-3"><dt className="text-xs text-[var(--text-muted)]">{messages.environment}</dt><dd><EnvironmentBadge environment={environment} locale={locale} /></dd></div></dl>
        <p className="mt-5 rounded-xl bg-[var(--muted)] p-4 text-xs leading-6 text-[var(--text-muted)]">{ar ? "تؤثر الإجراءات في هذه المساحة على بيانات البيئة الموضّحة أعلاه. راجعها قبل إجراء أي تغيير." : "Actions in this workspace affect the environment shown above. Check it before making changes."}</p>
      </section>
      <section className="surface-card p-6"><h2 className="text-base font-semibold">{messages.accessAndRoles}</h2><p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">{messages.accessManaged}</p><ul className="mt-6 space-y-3">{capabilities.map(item => <li key={item.label} className="flex items-center gap-3 rounded-xl border p-4"><span className="stat-icon tone-blue"><item.icon size={18} aria-hidden="true" /></span><span className="flex-1 text-xs font-medium">{item.label}</span><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${item.allowed ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--muted)] text-[var(--text-muted)]"}`}>{item.allowed ? (ar ? "متاح" : "Allowed") : (ar ? "غير متاح لدورك" : "Not available for your role")}</span></li>)}</ul></section>
    </div>
  </div>;
}
