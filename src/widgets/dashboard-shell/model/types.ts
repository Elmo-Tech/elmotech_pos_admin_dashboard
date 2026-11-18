export type NavStatus = "scaffold" | "active";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  status: NavStatus;
}

export interface NavSection {
  title: string;
  items: readonly NavItem[];
}
