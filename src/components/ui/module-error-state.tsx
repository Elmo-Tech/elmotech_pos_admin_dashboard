import { getMessages, type Locale } from "@/i18n/messages";
import { getServerEnvironment } from "@/server/env";

export function ModuleErrorState({ title, locale = "en" }: { title?: string; locale?: Locale }) {
  const messages = getMessages(locale, getServerEnvironment());
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-red-800">{title ?? messages.dataUnavailable}</p>
      <p className="mx-auto mt-1 max-w-lg text-sm text-red-600">
        {messages.dataUnavailableDescription}
      </p>
    </div>
  );
}
