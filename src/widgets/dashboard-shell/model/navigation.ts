import type { MessageKey } from "@/shared/i18n";

export interface MainNavItem {
  key: MessageKey;
  href: string;
  icon: "overview" | "customers" | "activation" | "subscriptions" | "plans" | "licenses" | "devices" | "issuances" | "audit" | "settings";
  group: "workspace" | "operations" | "settings";
}

/** The operator-facing workflow. Technical routes remain available contextually. */
export const MAIN_NAV_ITEMS: readonly MainNavItem[] = [
  { key: "navOverview", href: "/dashboard", icon: "overview", group: "workspace" },
  { key: "navCustomers", href: "/customers", icon: "customers", group: "workspace" },
  { key: "navActivationRequests", href: "/activation-requests", icon: "activation", group: "workspace" },
  { key: "navSubscriptions", href: "/subscriptions", icon: "subscriptions", group: "workspace" },
  { key: "navPlans", href: "/plans", icon: "plans", group: "workspace" },
  { key: "navLicenses", href: "/licenses", icon: "licenses", group: "operations" },
  { key: "navDevices", href: "/devices", icon: "devices", group: "operations" },
  { key: "navIssuances", href: "/issuances", icon: "issuances", group: "operations" },
  { key: "navAuditLogs", href: "/audit-logs", icon: "audit", group: "operations" },
  { key: "navSettings", href: "/settings", icon: "settings", group: "settings" },
] as const;
