import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  columns: string[];
}

/**
 * Shared shell for domain modules that have a route and an intended table
 * layout but no data wiring yet. Keeps the eventual list-view structure
 * (and its column semantics) visible without fabricating fake records.
 */
export function ModulePlaceholder({ title, description, columns }: ModulePlaceholderProps) {
  const tableColumns: DataTableColumn<never>[] = columns.map((column) => ({
    key: column,
    header: column,
    render: () => null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <DataTable
        columns={tableColumns}
        rows={[]}
        getRowKey={() => ""}
        emptyState={
          <EmptyState
            title="Data layer not yet connected"
            description="This module's layout is scaffolded. Wiring it to the Supabase licensing schema is a follow-up implementation slice."
          />
        }
      />
    </div>
  );
}
