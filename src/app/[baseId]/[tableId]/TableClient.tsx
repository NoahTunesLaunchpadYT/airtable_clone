// app/[baseId]/[tableId]/TableClient.tsx
"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useMemo } from "react";
import { api } from "~/trpc/react";

type ColumnMeta = {
  id: string;
  name: string;
  // keep it simple: DB returns string, and we can still compare to "number"
  type: string;
};

// shape returned from getRows (simplified)
type RowData = {
  id: string;
  tableId: string;
  index: number;
  values: unknown;
  createdAt: Date | null;
};

type TableClientProps = {
  tableId: string;
  columnsMeta: ColumnMeta[];
};

type FilterInput = {
  columnId: string;
  operator: "gt" | "contains" | "equals" | "lt";
  value: string | number;
};

type SortInput = {
  columnId: string;
  direction: "asc" | "desc";
};

export default function TableClient({
  tableId,
  columnsMeta
}: TableClientProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);

  // we are not doing real pagination yet, so offset can just be 0
  const offset = 0;
  const limit = 1000;

  const filtersForApi: FilterInput[] | undefined = useMemo(() => {
    if (columnFilters.length === 0) return undefined;

    return columnFilters.map<FilterInput>(f => {
      const colMeta = columnsMeta.find(c => c.id === f.id);

      const operator: FilterInput["operator"] =
        colMeta?.type === "number" ? "gt" : "contains"; // placeholder default

      const value = f.value as string;

      return {
        columnId: f.id,
        operator,
        value
      };
    });
  }, [columnFilters, columnsMeta]);

  const sortForApi: SortInput[] | undefined = useMemo(() => {
    if (sorting.length === 0) return undefined;

    return sorting.map<SortInput>(s => {
      const direction: SortInput["direction"] = s.desc
        ? "desc"
        : "asc";
      return {
        columnId: s.id,
        direction
      };
    });
  }, [sorting]);

  const { data, isLoading } = api.table.getRows.useQuery({
    tableId,
    offset,
    limit,
    filters: filtersForApi,
    sort: sortForApi
  });

  // cast the data into our RowData shape (matches rows table)
  const rowsData = (data ?? []) as RowData[];

  const columns = useMemo<ColumnDef<RowData>[]>(
    () =>
      columnsMeta.map(col => ({
        id: col.id,
        header: col.name,
        accessorFn: (row: RowData) => {
          const vals = row.values as Record<string, unknown> | null;
          return vals?.[col.id];
        },
        enableSorting: true,
        enableColumnFilter: true
      })),
    [columnsMeta]
  );

  const table = useReactTable<RowData>({
    data: rowsData,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualFiltering: true
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // for now, totalRows is just what we have; you'll replace this with real total count when you do infinite scroll
  const totalRows = rowsData.length;

  const rowVirtualizer = useVirtualizer({
    count: totalRows || 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 32
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const first = virtualRows[0];
  const last = virtualRows[virtualRows.length - 1];

  const paddingTop = first?.start ?? 0;
  const paddingBottom = last
    ? rowVirtualizer.getTotalSize() - last.end
    : 0;

  return (
    <div className="flex h-full flex-col">
      {/* simple status bar */}
      <div className="flex items-center gap-2 border-b p-2 text-sm">
        <span>
          {isLoading
            ? "Loading..."
            : `Rows loaded: ${rowsData.length}`}
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        <div style={{ height: rowVirtualizer.getTotalSize() }}>
          <div style={{ paddingTop, paddingBottom }}>
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const isSorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className="border-b px-2 py-1 text-left cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {isSorted === "asc" && " ▲"}
                          {isSorted === "desc" && " ▼"}
                        </th>
                      );
                    })}
                  </tr>
                ))}
                {/* filter row */}
                <tr>
                  {table.getHeaderGroups()[0]?.headers.map(header => (
                    <th key={header.id} className="border-b px-2 py-1">
                      {header.column.getCanFilter() ? (
                        <input
                          className="w-full border px-1 text-xs"
                          value={
                            (header.column.getFilterValue() as string) ??
                            ""
                          }
                          onChange={e =>
                            header.column.setFilterValue(e.target.value)
                          }
                          placeholder="Filter..."
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {virtualRows.map(virtualRow => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <tr key={row.id} className="border-b">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-2 py-1">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
