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
import { useRef, useState, useMemo, useEffect } from "react";
import { api } from "~/trpc/react";

type ColumnMeta = {
  id: string;
  name: string;
  type: string;
};

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

const INDEX_COL_WIDTH = 40;   // px
const DATA_COL_WIDTH = 530;   // px – change to 400 if you prefer

export default function TableClient({
  tableId,
  columnsMeta
}: TableClientProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);

  const [startIndex, setStartIndex] = useState(0);
  const windowSize = 100;

  const filtersForApi: FilterInput[] | undefined = useMemo(() => {
    if (columnFilters.length === 0) return undefined;

    return columnFilters.map<FilterInput>(f => {
      const colMeta = columnsMeta.find(c => c.id === f.id);

      const operator: FilterInput["operator"] =
        colMeta?.type === "number" ? "gt" : "contains";

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

  const {
    data,
    isLoading,
    isFetching
  } = api.table.getRows.useQuery({
    tableId,
    startIndex,
    windowSize,
    filters: filtersForApi,
    sort: sortForApi
  });

  const [lastData, setLastData] = useState<typeof data>();

  useEffect(() => {
    if (data !== undefined) {
      setLastData(data);
    }
  }, [data]);

  const effectiveData = data ?? lastData;

  const rowsData = (effectiveData?.rows ?? []) as RowData[];

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (effectiveData?.totalCount !== undefined) {
      setTotalCount(effectiveData.totalCount);
    }
  }, [effectiveData?.totalCount]);

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

  const rowVirtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 24 // ~24px row height
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const firstVirtual = virtualRows[0];
  const lastVirtual = virtualRows[virtualRows.length - 1];

  const paddingTop = firstVirtual?.start ?? 0;
  const paddingBottom = lastVirtual
    ? rowVirtualizer.getTotalSize() - lastVirtual.end
    : 0;

  useEffect(() => {
    if (virtualRows.length === 0 || totalCount === 0) return;
    if (isFetching) return;

    const first = virtualRows[0];
    const last = virtualRows[virtualRows.length - 1];

    if (!first || !last) return;

    const firstIndex = first.index;
    const lastIndex = last.index;

    const windowEnd = startIndex + windowSize;
    const buffer = Math.floor(windowSize / 4);

    const needShiftUp =
      firstIndex < startIndex + buffer && startIndex > 0;

    const needShiftDown =
      lastIndex > windowEnd - buffer && windowEnd < totalCount;

    if (!needShiftUp && !needShiftDown) {
      return;
    }

    const visibleCenter = Math.floor((firstIndex + lastIndex) / 2);
    let newStart = visibleCenter - Math.floor(windowSize / 2);

    if (newStart < 0) newStart = 0;
    const maxStart = Math.max(0, totalCount - windowSize);
    if (newStart > maxStart) newStart = maxStart;

    if (newStart !== startIndex) {
      setStartIndex(newStart);
    }
  }, [virtualRows, startIndex, windowSize, totalCount, isFetching]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-2 text-sm">
        <span>
          {isLoading && totalCount === 0
            ? "Loading..."
            : `Rows: ${totalCount} (window ${startIndex}–${
                startIndex + rowsData.length - 1
              })`}
        </span>
        {isFetching && totalCount > 0 && (
          <span className="text-xs text-gray-500">
            Updating window...
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        <div style={{ height: rowVirtualizer.getTotalSize() }}>
          <div style={{ paddingTop, paddingBottom }}>
            <table className="border-collapse text-xs">
              {/* fixed pixel widths for columns */}
              <colgroup>
                {/* index column */}
                <col style={{ width: INDEX_COL_WIDTH }} />
                {/* data columns */}
                {columnsMeta.map(col => (
                  <col
                    key={col.id}
                    style={{ width: DATA_COL_WIDTH }}
                  />
                ))}
              </colgroup>

              <thead className="sticky top-0 bg-gray-100">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="h-6">
                    <th className="border-b px-2 text-right text-[11px] text-gray-500">
                      #
                    </th>
                    {headerGroup.headers.map(header => {
                      const isSorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className="border-b px-2 text-left cursor-pointer"
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
                <tr className="h-6">
                  <th className="border-b px-2" />
                  {table.getHeaderGroups()[0]?.headers.map(header => (
                    <th key={header.id} className="border-b px-2">
                      {header.column.getCanFilter() ? (
                        <input
                          className="h-5 w-full border px-1 text-[11px]"
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
                {virtualRows.map(vRow => {
                  const absoluteIndex = vRow.index;

                  const row = table
                    .getRowModel()
                    .rows.find(
                      r => r.original.index === absoluteIndex
                    );

                  if (!row) {
                    return (
                      <tr key={absoluteIndex} className="h-6 border-b">
                        <td className="px-2 text-right text-[11px] text-gray-500">
                          {absoluteIndex + 1}
                        </td>
                        <td
                          colSpan={columnsMeta.length}
                          className="px-2 text-[11px] text-gray-400"
                        >
                          Loading...
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.id} className="h-6 border-b">
                      <td className="px-2 text-right text-[11px] text-gray-500">
                        {row.original.index + 1}
                      </td>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-2">
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
