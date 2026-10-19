import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
}

/**
 * A plain table renderer — columns in, rows out. No sorting, filtering,
 * pagination, or selection; those stay in whichever module needs them
 * once it has real data, rather than being half-built here.
 */
export function DataTable<T>({ columns, rows, getRowKey, emptyState }: DataTableProps<T>) {
  return (
    <div className="surface-card overflow-hidden border-white/80 shadow-[var(--sh-lg)]">
      <div className="overflow-x-auto">
        <table className="responsive-data-table min-w-full text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap border-b border-[var(--border)] px-5 py-4 text-start text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)] rtl:tracking-normal"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          {rows.length > 0 ? (
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <tr key={getRowKey(row)} className="group transition-colors hover:bg-blue-50/40">
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.header} className="whitespace-nowrap px-5 py-[18px] text-[var(--text-muted)] first:text-[var(--text)]">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>
      </div>
      {rows.length === 0 ? emptyState : null}
    </div>
  );
}
