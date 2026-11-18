import Link from "next/link";

interface EntityLinkProps {
  href: string;
  label: string;
  sublabel?: string;
}

/** Consistent styling for a link to an entity's (future) detail view. */
export function EntityLink({ href, label, sublabel }: EntityLinkProps) {
  return (
    <Link href={href} className="group inline-flex flex-col rounded-sm">
      <span className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)]">{label}</span>
      {sublabel ? <bdi className="mt-0.5 text-xs text-[var(--text-muted)]">{sublabel}</bdi> : null}
    </Link>
  );
}
