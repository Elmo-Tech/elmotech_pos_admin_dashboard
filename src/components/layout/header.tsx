"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Languages, LogOut, Menu, UserRound } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
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
  const activeItem = MAIN_NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

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
    <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-white/95 px-3 py-2 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="mobile-nav-trigger ghost-button size-10 p-0" aria-label={messages.openNavigation}>
          <Menu aria-hidden="true" size={20} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="hidden sm:inline">Elmo POS</span><span aria-hidden="true" className="hidden sm:inline">/</span><span className="truncate">{activeItem ? messages[activeItem.key] : messages.appName}</span>
          </div>
          {environment === "production" ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-red-700">
              <AlertTriangle aria-hidden="true" size={13} /><span>{messages.productionWarning}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={switchLanguage} disabled={switching} className="secondary-button h-9 min-h-9 px-3" aria-label={messages.language}>
          <Languages aria-hidden="true" size={16} /><span className="hidden sm:inline">{locale === "ar" ? messages.switchToEnglish : messages.switchToArabic}</span>
        </button>
        <div className="hidden items-center gap-2.5 border-s border-[var(--border)] ps-3 md:flex">
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--on-primary-soft)]"><UserRound aria-hidden="true" size={17} /></span>
          <div className="min-w-0 text-start">
            <p className="technical-value max-w-40 truncate text-sm font-medium text-[var(--text)]">{userEmail ?? messages.signedInAdmin}</p>
            <p className="text-xs text-[var(--text-muted)]">{userRole}</p>
          </div>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="ghost-button size-9 min-h-9 p-0" aria-label={messages.signOut} title={messages.signOut}>
            <LogOut aria-hidden="true" size={17} className="rtl:rotate-180" />
          </button>
        </form>
      </div>
    </header>
  );
}
