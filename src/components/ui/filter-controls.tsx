import Link from "next/link";
import type { ReactNode } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import { getMessages, type Locale } from "@/i18n/messages";

export function ListFilterForm({ action, children, locale }: { action: string; children: ReactNode; locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <form action={action} method="get">
      <FilterBar>
        {children}
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {messages.apply}
        </button>
        <Link href={action} className="px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          {messages.clear}
        </Link>
      </FilterBar>
    </form>
  );
}

export function SearchField({ name = "search", defaultValue = "", placeholder = "Search…" }: { name?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <input
      name={name}
      type="search"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="min-w-56 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

export function SelectField({ name, defaultValue = "", label, options }: { name: string; defaultValue?: string; label: string; options: readonly { value: string; label: string }[] }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={defaultValue} aria-label={label} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
