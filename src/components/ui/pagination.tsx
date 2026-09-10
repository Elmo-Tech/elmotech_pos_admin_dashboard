import Link from "next/link";
import { getMessages, interpolate, type Locale } from "@/i18n/messages";
import { formatNumber } from "@/lib/format";

interface PaginationProps {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  query?: Record<string, string>;
  locale: Locale;
}

export function Pagination({ basePath, page, pageSize, total, query = {}, locale }: PaginationProps) {
  const messages = getMessages(locale);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <p>
        {total === 0 ? messages.noRecords : interpolate(messages.recordsRange, {
          from: formatNumber((page - 1) * pageSize + 1, locale),
          to: formatNumber(Math.min(page * pageSize, total), locale),
          total: formatNumber(total, locale),
        })}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">
            {messages.previous}
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-300">{messages.previous}</span>
        )}
        <span className="px-1">{messages.page} {formatNumber(Math.min(page, totalPages), locale)} {messages.of} {formatNumber(totalPages, locale)}</span>
        {page < totalPages ? (
          <Link href={makeHref(page + 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">
            {messages.next}
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-300">{messages.next}</span>
        )}
      </div>
    </div>
  );
}
