import Link from "next/link";

interface EntityLinkProps {
  href: string;
  label: string;
  sublabel?: string;
}

/** Consistent styling for a link to an entity's (future) detail view. */
export function EntityLink({ href, label, sublabel }: EntityLinkProps) {
  return (
    <Link href={href} className="group inline-flex flex-col">
      <span className="text-sm font-medium text-slate-900 group-hover:underline">{label}</span>
      {sublabel ? <bdi className="text-xs text-slate-500">{sublabel}</bdi> : null}
    </Link>
  );
}
