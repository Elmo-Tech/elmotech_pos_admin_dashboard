import { getMessages, type Locale } from "@/i18n/messages";

export function AuthNotConfigured({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-900">{messages.authNotConfigured}</p>
      <p className="mt-1 text-sm text-slate-500">
        {messages.authNotConfiguredDescription}
      </p>
    </div>
  );
}
