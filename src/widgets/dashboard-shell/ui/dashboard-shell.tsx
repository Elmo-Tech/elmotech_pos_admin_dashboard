"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import type { AppEnvironment } from "@/shared/model/environment";
import { getMessages, type Locale } from "@/shared/i18n";

interface DashboardShellProps {
  environment: AppEnvironment;
  userEmail: string | null;
  userRole: string;
  locale: Locale;
  children: ReactNode;
}

export function DashboardShell({ environment, userEmail, userRole, locale, children }: DashboardShellProps) {
  const [compact, setCompact] = useState(false);
  const mobileNav = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const messages = getMessages(locale, environment);

  useEffect(() => {
    mobileNav.current?.close();
  }, [pathname]);

  useEffect(() => {
    const dialog = mobileNav.current;
    const unlock = () => document.body.style.removeProperty("overflow");
    dialog?.addEventListener("close", unlock);
    const media = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (media.matches) dialog?.close(); };
    media.addEventListener("change", onResize);
    return () => { dialog?.removeEventListener("close", unlock); media.removeEventListener("change", onResize); unlock(); };
  }, []);

  function openNavigation() {
    mobileNav.current?.showModal();
    document.body.style.overflow = "hidden";
  }

  return (
    <div className="dashboard-workspace" data-compact={compact}>
      <a href="#workspace-content" className="skip-link">{locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}</a>
      <div className="desktop-sidebar">
        <Sidebar locale={locale} environment={environment} compact={compact} onToggleCompact={() => setCompact(!compact)} />
      </div>
      <dialog ref={mobileNav} className="mobile-navigation" aria-label={messages.businessNavigation} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <Sidebar locale={locale} environment={environment} onNavigate={() => mobileNav.current?.close()} />
      </dialog>
      <div className="workspace-body">
        <Header environment={environment} userEmail={userEmail} userRole={userRole} locale={locale} onMenuClick={openNavigation} />
        <main id="workspace-content" tabIndex={-1} className="workspace-content">{children}</main>
        <footer className="workspace-footer"><span>{locale === "ar" ? "المدير · مساحة عمليات التراخيص" : "Elmodeer · Licensing workspace"}</span><span>Elmo Tech © {new Date().getFullYear()}</span></footer>
      </div>
    </div>
  );
}
