"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  FileOutput,
  KeyRound,
  LayoutDashboard,
  MonitorSmartphone,
  Package,
  Settings2,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { MAIN_NAV_ITEMS, type MainNavItem } from "../model/navigation";
import { cn } from "@/shared/lib/utils";
import { getMessages, type Locale } from "@/shared/i18n";
import type { AppEnvironment } from "@/shared/model/environment";

const ICONS: Record<MainNavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  customers: Users,
  activation: FileCheck2,
  subscriptions: CalendarClock,
  plans: Package,
  licenses: KeyRound,
  devices: MonitorSmartphone,
  issuances: FileOutput,
  audit: Activity,
  settings: Settings2,
};

export function Sidebar({ locale, environment, onNavigate }: {
  locale: Locale;
  environment: AppEnvironment;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const messages = getMessages(locale, environment);
  const workspaceItems = MAIN_NAV_ITEMS.filter((item) => item.group === "workspace");
  const operationItems = MAIN_NAV_ITEMS.filter((item) => item.group === "operations");
  const settingsItem = MAIN_NAV_ITEMS.find((item) => item.group === "settings");

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-e border-[var(--side-border)] bg-[var(--side-bg)] text-white">
      <div className="flex h-20 shrink-0 items-center justify-between px-5">
        <Link href="/dashboard" onClick={onNavigate} className="group flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-secondary))] text-white shadow-[var(--sh-primary)]">
            <BadgeCheck aria-hidden="true" size={22} strokeWidth={1.9} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-tight">Elmo POS</span>
            <span className="mt-0.5 block truncate text-xs text-[var(--side-muted)]">{messages.licenseOperations}</span>
          </span>
        </Link>
        {onNavigate ? (
          <button type="button" onClick={onNavigate} className="mobile-nav-trigger flex size-9 items-center justify-center rounded-lg text-[var(--side-muted)] hover:bg-[var(--side-surface)] hover:text-white" aria-label={messages.closeNavigation}>
            <X aria-hidden="true" size={19} />
          </button>
        ) : null}
      </div>

      <div className="mx-3 rounded-[10px] border border-[var(--side-border)] bg-[var(--side-surface)] p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
            <ShieldCheck aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--side-muted)]">{messages.environment}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{environment === "production" ? messages.production : messages.staging}</p>
          </div>
        </div>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
        <NavGroup label={messages.businessNavigation} items={workspaceItems} pathname={pathname} messages={messages} onNavigate={onNavigate} />
        <NavGroup label={messages.operationsNavigation} items={operationItems} pathname={pathname} messages={messages} onNavigate={onNavigate} className="mt-7" />
      </div>

      {settingsItem ? (
        <div className="border-t border-[var(--side-border)] p-3">
          <NavLink item={settingsItem} pathname={pathname} label={messages[settingsItem.key]} onNavigate={onNavigate} />
        </div>
      ) : null}
    </aside>
  );
}

function NavGroup({ label, items, pathname, messages, onNavigate, className }: {
  label: string;
  items: readonly MainNavItem[];
  pathname: string;
  messages: ReturnType<typeof getMessages>;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={className} aria-label={label}>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--side-muted)] rtl:tracking-normal">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => <li key={item.href}><NavLink item={item} pathname={pathname} label={messages[item.key]} onNavigate={onNavigate} /></li>)}
      </ul>
    </nav>
  );
}

function NavLink({ item, pathname, label, onNavigate }: {
  item: MainNavItem;
  pathname: string;
  label: string;
  onNavigate?: () => void;
}) {
  const Icon = ICONS[item.icon];
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link href={item.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined} className={cn(
      "relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition-all",
      isActive ? "bg-[linear-gradient(135deg,var(--primary),var(--primary-secondary))] text-white shadow-[var(--sh-primary)]" : "text-slate-300 hover:translate-x-0.5 hover:bg-[var(--side-surface)] hover:text-white rtl:hover:-translate-x-0.5",
    )}>
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
