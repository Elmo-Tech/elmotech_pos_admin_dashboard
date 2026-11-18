"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
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

export function Sidebar({ locale, environment, onNavigate, compact = false, onToggleCompact }: {
  locale: Locale;
  environment: AppEnvironment;
  onNavigate?: () => void;
  compact?: boolean;
  onToggleCompact?: () => void;
}) {
  const pathname = usePathname();
  const messages = getMessages(locale, environment);
  const workspaceItems = MAIN_NAV_ITEMS.filter((item) => item.group === "workspace");
  const operationItems = MAIN_NAV_ITEMS.filter((item) => item.group === "operations");
  const settingsItem = MAIN_NAV_ITEMS.find((item) => item.group === "settings");

  return (
    <aside className="workspace-sidebar" data-compact={compact}>
      <div className="sidebar-brand">
        <Link href="/dashboard" onClick={onNavigate} aria-label={locale === "ar" ? "المدير — الرئيسية" : "Elmodeer — Overview"}>
          <Image src="/brand/elmodeer-on-ink.png" width={120} height={49} alt={locale === "ar" ? "المدير" : "Elmodeer"} className="brand-wordmark" priority />
        </Link>
        {onNavigate ? <button type="button" onClick={onNavigate} className="sidebar-icon-button" aria-label={messages.closeNavigation}><X aria-hidden="true" size={20} /></button> : null}
      </div>
      <div className="sidebar-workspace">
        <span className="workspace-emblem"><ShieldCheck aria-hidden="true" size={20} /></span>
        <div className="sidebar-copy"><p>{messages.licenseOperations}</p><span>{environment === "production" ? messages.production : messages.staging}</span></div>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
        <NavGroup label={messages.businessNavigation} items={workspaceItems} pathname={pathname} messages={messages} onNavigate={onNavigate} />
        <NavGroup label={messages.operationsNavigation} items={operationItems} pathname={pathname} messages={messages} onNavigate={onNavigate} className="mt-6" />
      </div>

      {settingsItem ? (
        <div className="border-t border-[var(--side-border)] p-3">
          <NavLink item={settingsItem} pathname={pathname} label={messages[settingsItem.key]} onNavigate={onNavigate} />
        </div>
      ) : null}
      {onToggleCompact ? <button type="button" onClick={onToggleCompact} className="sidebar-collapse" aria-label={compact ? (locale === "ar" ? "توسيع القائمة" : "Expand navigation") : (locale === "ar" ? "تصغير القائمة" : "Collapse navigation")} aria-expanded={!compact}>
        {compact ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}<span>{locale === "ar" ? "تصغير القائمة" : "Collapse sidebar"}</span>
      </button> : null}
      <p className="sidebar-credit">ELMODEER <span>OPERATIONS</span></p>
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
      <p className="sidebar-group-title">{label}</p>
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
    <Link href={item.href} onClick={onNavigate} title={label} aria-current={isActive ? "page" : undefined} className={cn(
      "sidebar-nav-link",
      isActive && "is-active",
    )}>
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
