import { PageHeader } from "@/components/ui/page-header";
import { EnvironmentBadge } from "@/components/layout/environment-badge";
import { getMessages } from "@/i18n/messages";
import { getServerEnvironment } from "@/server/env";
import { getLocale } from "@/server/i18n/get-locale";

export default async function SettingsPage() {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={locale === "ar" ? "إعداد مساحة العمل" : "Workspace setup"} title={messages.settingsTitle} description={messages.settingsDescription} />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="text-base font-semibold text-[var(--text)]">{messages.environment}</h2>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">{messages.environmentDescription}</p>
          <div className="mt-4"><EnvironmentBadge environment={environment} locale={locale} /></div>
        </section>
        <section className="surface-card p-6">
          <h2 className="text-base font-semibold text-[var(--text)]">{messages.accessAndRoles}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{messages.accessManaged}</p>
        </section>
      </div>
    </div>
  );
}
