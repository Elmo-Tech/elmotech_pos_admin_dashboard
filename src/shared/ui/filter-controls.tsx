import Link from "next/link";
import type { ReactNode } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { FilterBar } from "@/shared/ui/filter-bar";
import { getMessages, type Locale } from "@/shared/i18n";

export function ListFilterForm({ action, children, locale }: { action: string; children: ReactNode; locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <form action={action} method="get" aria-label={locale === "ar" ? "تصفية النتائج" : "Filter results"}>
      <FilterBar>
        {children}
        <button type="submit" className="secondary-button filter-apply">
          <SlidersHorizontal aria-hidden="true" size={16} />{messages.apply}
        </button>
        <Link href={action} className="ghost-button">
          <RotateCcw aria-hidden="true" size={15} />{messages.clear}
        </Link>
      </FilterBar>
    </form>
  );
}

export function SearchField({ name = "search", defaultValue = "", placeholder = "Search…" }: { name?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="relative min-w-0 flex-1 basis-56">
      <span className="sr-only">{placeholder}</span>
      <Search aria-hidden="true" size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      <input name={name} type="search" defaultValue={defaultValue} placeholder={placeholder} className="w-full py-2 pe-3 ps-10 text-sm" />
    </label>
  );
}

export function SelectField({ name, defaultValue = "", label, options }: { name: string; defaultValue?: string; label: string; options: readonly { value: string; label: string }[] }) {
  return (
    <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} aria-label={label} className="px-3 py-2 text-sm text-[var(--text)]">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
