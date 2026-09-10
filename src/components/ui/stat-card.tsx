import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}

export function StatCard({ label, value, hint, href }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{content}</div>
  );
}
