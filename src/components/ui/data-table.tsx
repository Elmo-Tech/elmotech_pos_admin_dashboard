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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-slate-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          {rows.length > 0 ? (
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-4 py-3.5 text-slate-700">
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
