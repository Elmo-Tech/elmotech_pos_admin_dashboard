"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import { EnvironmentBadge } from "@/components/layout/environment-badge";
import { signOutAction } from "@/server/auth/actions";
import { getMessages, type Locale } from "@/i18n/messages";
import type { AppEnvironment } from "@/types/environment";

interface HeaderProps {
  environment: AppEnvironment;
  userEmail: string | null;
  userRole: string;
  locale: Locale;
  onMenuClick: () => void;
}

export function Header({ environment, userEmail, userRole, locale, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const messages = getMessages(locale, environment);
  const activeItem = MAIN_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  async function switchLanguage() {
    setSwitching(true);
    try {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }),
      });
      if (response.ok) router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="flex flex-col">
      {environment === "production" ? (
        <div className="bg-red-600 px-4 py-1.5 text-center text-xs font-semibold text-white">
          {messages.productionWarning}
        </div>
      ) : null}
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label={messages.openNavigation}
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
          <h2 className="truncate text-base font-semibold text-slate-900">
            {activeItem ? messages[activeItem.key] : messages.appName}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={switchLanguage}
            disabled={switching}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {locale === "ar" ? messages.switchToEnglish : messages.switchToArabic}
          </button>
          <EnvironmentBadge environment={environment} locale={locale} />
          <div className="hidden text-end sm:block">
            <p className="technical-value max-w-44 truncate text-sm text-slate-700">
              {userEmail ?? messages.signedInAdmin}
            </p>
            <p className="text-xs font-medium text-slate-500">{userRole}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {messages.signOut}
            </button>
          </form>
        </div>
      </header>
    </div>
  );
}
