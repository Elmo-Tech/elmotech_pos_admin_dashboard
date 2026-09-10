"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { getMessages, type Locale } from "@/i18n/messages";

/** Shared by the desktop rail and the mobile drawer — same instance, same model. */
export function Sidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const messages = getMessages(locale);

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-e border-slate-200 bg-white">
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200 px-4">
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          {messages.appName}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {messages[item.key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
