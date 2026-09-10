"use client";

import { useEffect } from "react";
import { getMessages, type Locale } from "@/i18n/messages";

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
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center">
      <p className="text-sm font-medium text-red-800">{messages.loadError}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        {messages.tryAgain}
      </button>
    </div>
  );
}
