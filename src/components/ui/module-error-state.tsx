import { getMessages, type Locale } from "@/i18n/messages";
import { getServerEnvironment } from "@/server/env";
import { AlertCircle } from "lucide-react";

export function ModuleErrorState({ title, locale = "en" }: { title?: string; locale?: Locale }) {
  const messages = getMessages(locale, getServerEnvironment());
  return (
    <div className="surface-card border-red-200 px-6 py-12 text-center">
      <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]"><AlertCircle aria-hidden="true" size={21} /></span>
      <p className="text-base font-semibold text-[var(--text)]">{title ?? messages.dataUnavailable}</p>
      <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-[var(--text-muted)]">
        {messages.dataUnavailableDescription}
      </p>
    </div>
  );
}
