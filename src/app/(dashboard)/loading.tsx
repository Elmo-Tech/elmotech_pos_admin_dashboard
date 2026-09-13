import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/server/i18n/get-locale";
import { getServerEnvironment } from "@/server/env";

export default async function DashboardLoading() {
  const messages = getMessages(await getLocale(), getServerEnvironment());
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-label={messages.overviewDescription}>
      <div>
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-lg border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-56 rounded-lg border border-slate-200 bg-white" />
    </div>
  );
}
