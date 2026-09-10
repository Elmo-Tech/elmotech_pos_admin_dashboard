interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 4, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <div key={columnIndex} className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
