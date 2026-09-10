import { PageHeader } from "@/components/ui/page-header";
import { EnvironmentBadge } from "@/components/layout/environment-badge";
import { getMessages } from "@/i18n/messages";
import { getServerEnvironment } from "@/server/env";
import { getLocale } from "@/server/i18n/get-locale";

export default async function SettingsPage() {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={messages.settingsTitle} description={messages.settingsDescription} />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{messages.environment}</h2>
          <p className="mt-1 text-sm text-slate-500">{messages.environmentDescription}</p>
          <div className="mt-4"><EnvironmentBadge environment={environment} locale={locale} /></div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{messages.accessAndRoles}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{messages.accessManaged}</p>
        </section>
      </div>
    </div>
  );
}
