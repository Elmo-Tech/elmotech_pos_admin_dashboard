"use client";

import { useEffect } from "react";
import { getMessages, type Locale } from "@/shared/i18n";
import { AlertCircle, RotateCcw } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const locale: Locale = typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en";
  const messages = getMessages(locale);
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 border-red-200 px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]"><AlertCircle aria-hidden="true" size={21} /></span>
      <p className="text-base font-semibold text-[var(--text)]">{messages.loadError}</p>
      <button
        type="button"
        onClick={reset}
        className="secondary-button mt-2"
      >
        <RotateCcw aria-hidden="true" size={16} />{messages.tryAgain}
      </button>
    </div>
  );
}
