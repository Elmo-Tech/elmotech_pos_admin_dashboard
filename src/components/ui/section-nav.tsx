interface SectionNavProps {
  items: readonly { href: string; label: string }[];
  ariaLabel?: string;
}

export function SectionNav({ items, ariaLabel = "Page sections" }: SectionNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1" aria-label={ariaLabel}>
      {items.map((item) => (
        <a key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          {item.label}
        </a>
      ))}
    </nav>
  );
}
