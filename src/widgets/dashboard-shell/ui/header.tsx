"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Languages, LoaderCircle, LogOut, Menu, UserRound } from "lucide-react";
import { MAIN_NAV_ITEMS } from "../model/navigation";
import { QuickNavigation } from "./quick-navigation";
import { signOutAction } from "@/features/sign-out/server";
import { getMessages, type Locale } from "@/shared/i18n";
import type { AppEnvironment } from "@/shared/model/environment";

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
  const [languageError, setLanguageError] = useState(false);
  const messages = getMessages(locale, environment);
  const activeItem = MAIN_NAV_ITEMS.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isDetail = activeItem && pathname !== activeItem.href;

  async function switchLanguage() {
    setSwitching(true);
    setLanguageError(false);
    try {
      const response = await fetch("/api/locale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }) });
      if (!response.ok) throw new Error("Locale unavailable");
      router.refresh();
    } catch { setLanguageError(true); }
    finally { setSwitching(false); }
  }

  return (
    <header className="workspace-header">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="mobile-nav-trigger icon-button" aria-label={messages.openNavigation} aria-haspopup="dialog"><Menu aria-hidden="true" size={21} /></button>
        <nav aria-label={locale === "ar" ? "مسار الصفحة" : "Breadcrumb"} className="workspace-breadcrumb">
          <span className="hidden xl:inline">{locale === "ar" ? "مساحة العمل" : "Workspace"}</span>
          <ChevronLeft aria-hidden="true" size={14} className="hidden ltr:rotate-180 xl:block" />
          {isDetail ? <><Link href={activeItem.href}>{messages[activeItem.key]}</Link><ChevronLeft aria-hidden="true" size={14} className="ltr:rotate-180" /><span aria-current="page">{locale === "ar" ? "التفاصيل" : "Details"}</span></> : <span aria-current="page">{activeItem ? messages[activeItem.key] : messages.appName}</span>}
        </nav>
      </div>
      <div className="header-tools">
        <QuickNavigation locale={locale} />
        <span className={`environment-indicator ${environment === "production" ? "is-production" : ""}`} title={environment === "production" ? messages.productionWarning : messages.staging}>
          <span aria-hidden="true" />{environment === "production" ? messages.production : messages.staging}
        </span>
        <button type="button" onClick={switchLanguage} disabled={switching} className="icon-button language-button" aria-label={messages.language} title={locale === "ar" ? messages.switchToEnglish : messages.switchToArabic}>
          {switching ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Languages size={18} aria-hidden="true" />}<span>{locale === "ar" ? "EN" : "عربي"}</span>
        </button>
        <details className="account-menu">
          <summary className="account-trigger" aria-label={`${userEmail ?? messages.signedInAdmin} · ${userRole}`}>
            <span className="account-avatar"><UserRound aria-hidden="true" size={18} /></span>
            <span className="hidden text-start xl:block"><span className="block text-xs font-bold">{userRole}</span><bdi className="block max-w-36 truncate text-[11px] text-[var(--text-muted)]">{userEmail ?? messages.signedInAdmin}</bdi></span>
          </summary>
          <div className="account-popover"><p className="text-sm font-bold">{userRole}</p><bdi className="mt-1 block break-all text-xs text-[var(--text-muted)]">{userEmail ?? messages.signedInAdmin}</bdi><form action={signOutAction} className="mt-4 border-t pt-3"><button type="submit" className="ghost-button w-full justify-start text-[var(--danger)]"><LogOut aria-hidden="true" size={17} className="rtl:rotate-180" />{messages.signOut}</button></form></div>
        </details>
      </div>
      {languageError ? <p role="alert" className="header-error"><AlertTriangle size={15} aria-hidden="true" />{locale === "ar" ? "تعذر تغيير اللغة. حاول مرة أخرى." : "Language could not be changed. Please retry."}</p> : null}
    </header>
  );
}
