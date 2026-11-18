import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMessages, interpolate, type Locale } from "@/shared/i18n";
import { formatNumber } from "@/shared/lib/format";

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
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
      <p>
        {total === 0 ? messages.noRecords : interpolate(messages.recordsRange, {
          from: formatNumber((page - 1) * pageSize + 1, locale),
          to: formatNumber(Math.min(page * pageSize, total), locale),
          total: formatNumber(total, locale),
        })}
      </p>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className="secondary-button h-9 min-h-9 px-3">
            <ChevronRight aria-hidden="true" size={15} className="ltr:rotate-180" />{messages.previous}
          </Link>
        ) : (
          <span className="secondary-button h-9 min-h-9 cursor-not-allowed px-3 opacity-45"><ChevronRight aria-hidden="true" size={15} className="ltr:rotate-180" />{messages.previous}</span>
        )}
        <span className="px-1">{messages.page} {formatNumber(Math.min(page, totalPages), locale)} {messages.of} {formatNumber(totalPages, locale)}</span>
        {page < totalPages ? (
          <Link href={makeHref(page + 1)} className="secondary-button h-9 min-h-9 px-3">
            {messages.next}<ChevronLeft aria-hidden="true" size={15} className="ltr:rotate-180" />
          </Link>
        ) : (
          <span className="secondary-button h-9 min-h-9 cursor-not-allowed px-3 opacity-45">{messages.next}<ChevronLeft aria-hidden="true" size={15} className="ltr:rotate-180" /></span>
        )}
      </div>
    </div>
  );
}
