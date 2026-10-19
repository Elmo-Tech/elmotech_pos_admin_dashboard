"use client";

import { useState, type ReactNode } from "react";
import { CreditCard, History, KeyRound, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "overview" | "subscription" | "licensing" | "history";

interface CustomerProfileTabsProps {
  locale: "ar" | "en";
  labels: Record<TabId, string>;
  overview: ReactNode;
  subscription: ReactNode;
  licensing: ReactNode;
  history: ReactNode;
}

const TAB_ICONS = {
  overview: LayoutDashboard,
  subscription: CreditCard,
  licensing: KeyRound,
  history: History,
} as const;

export function CustomerProfileTabs({
  locale,
  labels,
  overview,
  subscription,
  licensing,
  history,
}: CustomerProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const panels = { overview, subscription, licensing, history };
  const tabs = Object.keys(TAB_ICONS) as TabId[];

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-1 mb-7 overflow-x-auto bg-[var(--bg)]/92 px-1 py-2 backdrop-blur-xl">
        <div
          className="surface-card mx-auto flex min-w-max gap-1.5 p-1.5 shadow-[var(--sh-sm)] sm:min-w-0"
          role="tablist"
          aria-label={locale === "ar" ? "أقسام ملف العميل" : "Customer profile sections"}
        >
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                id={`customer-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`customer-panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all",
                  selected
                    ? "bg-[var(--text)] text-white shadow-lg shadow-slate-950/15"
                    : "text-[var(--text-muted)] hover:bg-[var(--muted)] hover:text-[var(--text)]",
                )}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={2} />
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((tab) => activeTab === tab ? (
        <div
          key={tab}
          id={`customer-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`customer-tab-${tab}`}
          className="animate-fade-up"
        >
          {panels[tab]}
        </div>
      ) : null)}
    </div>
  );
}
