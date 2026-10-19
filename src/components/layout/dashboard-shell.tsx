"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { AppEnvironment } from "@/types/environment";
import type { Locale } from "@/i18n/messages";

interface DashboardShellProps {
  environment: AppEnvironment;
  userEmail: string | null;
  userRole: string;
  locale: Locale;
  children: ReactNode;
}

export function DashboardShell({ environment, userEmail, userRole, locale, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-1 bg-[var(--bg)]">
      <div className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar locale={locale} environment={environment} />
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full shadow-2xl">
            <Sidebar locale={locale} environment={environment} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <Header
          environment={environment}
          userEmail={userEmail}
          userRole={userRole}
          locale={locale}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
