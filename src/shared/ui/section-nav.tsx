interface SectionNavProps {
  items: readonly { href: string; label: string }[];
  ariaLabel?: string;
}

export function SectionNav({ items, ariaLabel = "Page sections" }: SectionNavProps) {
  return (
    <nav className="flex flex-wrap gap-6 border-b border-[var(--border)]" aria-label={ariaLabel}>
      {items.map((item) => (
        <a key={item.href} href={item.href} className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--text)]">
          {item.label}
        </a>
      ))}
    </nav>
  );
}
