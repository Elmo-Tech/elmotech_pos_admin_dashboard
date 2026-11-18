"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { MAIN_NAV_ITEMS } from "../model/navigation";
import { getMessages, type Locale } from "@/shared/i18n";

/** Navigation search only: no customer data or privileged APIs enter this client. */
export function QuickNavigation({ locale }: { locale: Locale }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const titleId = useId();
  const t = getMessages(locale);
  const label = locale === "ar" ? "انتقل إلى أي شاشة…" : "Jump to a workspace…";
  const items = MAIN_NAV_ITEMS.filter(item => `${t[item.key]} ${item.href}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  function open() {
    setQuery("");
    dialog.current?.showModal();
    input.current?.focus();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button type="button" className="workspace-search" onClick={open} aria-label={label} aria-haspopup="dialog">
        <Search size={17} aria-hidden="true" />
        <span>{label}</span><kbd>⌘ / Ctrl K</kbd>
      </button>
      <dialog ref={dialog} className="navigation-dialog" aria-labelledby={titleId} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <div className="flex items-center gap-3 border-b p-4">
          <Search size={21} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <h2 id={titleId} className="sr-only">{label}</h2>
          <input ref={input} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={label} aria-label={label} className="min-w-0 flex-1 px-3 py-2" onKeyDown={event => {
            if (event.key === "ArrowDown") { event.preventDefault(); dialog.current?.querySelector<HTMLAnchorElement>("a")?.focus(); }
          }} />
          <button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label={t.closeNavigation}><X size={18} /></button>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto p-2">
          <p className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)]">{locale === "ar" ? "مساحات العمل" : "Workspaces"}</p>
          {items.map(item => <Link key={item.href} href={item.href} onClick={() => dialog.current?.close()} className="quick-nav-result" onKeyDown={event => {
            const links = Array.from(dialog.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
            const index = links.indexOf(event.currentTarget);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              links[(index + (event.key === "ArrowDown" ? 1 : links.length - 1)) % links.length]?.focus();
            }
          }}><span>{t[item.key]}</span><ArrowUpRight size={16} className="rtl:-rotate-90" aria-hidden="true" /></Link>)}
          {items.length === 0 ? <p role="status" className="p-6 text-center text-sm text-[var(--text-muted)]">{locale === "ar" ? "لا توجد شاشة بهذا الاسم. جرّب كلمة أخرى." : "No matching workspace. Try another name."}</p> : null}
        </div>
        <p className="border-t px-5 py-3 text-xs text-[var(--text-muted)]">{locale === "ar" ? "↑ ↓ للتنقل · Enter للفتح · Esc للإغلاق" : "↑ ↓ to navigate · Enter to open · Esc to close"}</p>
      </dialog>
    </>
  );
}
