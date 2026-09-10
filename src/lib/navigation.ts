import type { MessageKey } from "@/i18n/messages";

export interface MainNavItem {
  key: MessageKey;
  href: string;
}

/** The operator-facing workflow. Technical routes remain available contextually. */
export const MAIN_NAV_ITEMS: readonly MainNavItem[] = [
  { key: "navOverview", href: "/dashboard" },
  { key: "navCustomers", href: "/customers" },
  { key: "navActivationRequests", href: "/activation-requests" },
  { key: "navSubscriptions", href: "/subscriptions" },
  { key: "navPlans", href: "/plans" },
  { key: "navSettings", href: "/settings" },
] as const;
