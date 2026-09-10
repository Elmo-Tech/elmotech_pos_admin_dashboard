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
    <div className="flex min-h-full flex-1">
      <div className="hidden lg:block">
        <Sidebar locale={locale} />
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50">
            <Sidebar locale={locale} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          environment={environment}
          userEmail={userEmail}
          userRole={userRole}
          locale={locale}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
