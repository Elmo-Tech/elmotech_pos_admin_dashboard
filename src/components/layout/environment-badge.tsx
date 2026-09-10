import type { AppEnvironment } from "@/types/environment";
import { cn } from "@/lib/utils";
import { getMessages, type Locale } from "@/i18n/messages";

interface EnvironmentBadgeProps {
  environment: AppEnvironment;
  locale?: Locale;
}

/**
 * Purely presentational — the environment it renders must come from the
 * server-validated chain (`getServerEnvironment()` -> layout -> this
 * prop), never re-derived client-side. Styling is already structured so a
 * future Production state can become visually louder (see the banner in
 * `Header`) without this component's contract changing.
 */
export function EnvironmentBadge({ environment, locale = "en" }: EnvironmentBadgeProps) {
  const isProduction = environment === "production";
  const messages = getMessages(locale);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        isProduction
          ? "bg-red-50 text-red-700 ring-red-600/20"
          : "bg-amber-50 text-amber-700 ring-amber-600/20",
      )}
      title={isProduction ? messages.production : messages.staging}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", isProduction ? "bg-red-500" : "bg-amber-500")}
      />
      {isProduction ? messages.production : messages.staging}
    </span>
  );
}
