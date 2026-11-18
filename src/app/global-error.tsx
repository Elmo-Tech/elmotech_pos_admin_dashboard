"use client";

import { useEffect } from "react";
import { directionFor, getMessages, type Locale } from "@/shared/i18n";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Catches errors thrown outside any nested error.tsx boundary — notably
 * `EnvironmentConfigurationError` from `src/server/env.ts`, which is
 * thrown deliberately (fail-closed) from the `(dashboard)` layout and
 * from /login when the environment/project configuration is invalid.
 * That's an operator-facing misconfiguration, not a normal user error,
 * so this intentionally does not expose `error.message` (which may
 * contain configuration details) to the page.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const locale: Locale = typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en";
  const messages = getMessages(locale);
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} dir={directionFor(locale)}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-red-700">{messages.configurationError}</p>
          <p className="mt-2 text-sm text-slate-600">
            {messages.configurationErrorDescription}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {messages.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
