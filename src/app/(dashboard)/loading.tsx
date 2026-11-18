import { getMessages } from "@/shared/i18n";
import { getLocale } from "@/shared/i18n/server";
import { getServerEnvironment } from "@/shared/config/server";

export default async function DashboardLoading() {
  const messages = getMessages(await getLocale(), getServerEnvironment());
  return (
    <div className="flex animate-pulse flex-col gap-8" role="status" aria-busy="true" aria-label={messages.overviewDescription}>
      <div>
        <div className="h-8 w-48 rounded bg-[var(--muted)]" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-[var(--muted)]" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="surface-card h-32" />
        ))}
      </div>
      <div className="surface-card h-64" />
    </div>
  );
}
