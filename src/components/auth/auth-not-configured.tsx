import { getMessages, type Locale } from "@/i18n/messages";

export function AuthNotConfigured({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <div className="rounded-[10px] border border-dashed border-amber-300 bg-[var(--warning-soft)]/50 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-[var(--text)]">{messages.authNotConfigured}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {messages.authNotConfiguredDescription}
      </p>
    </div>
  );
}
