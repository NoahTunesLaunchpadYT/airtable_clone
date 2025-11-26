// app/[baseId]/[tableId]/tableClient.tsx

"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
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

type SortDirection = "none" | "asc" | "desc";

type TextFilterOp =
  | "contains"
  | "doesNotContain"
  | "is"
  | "isNot"
  | "isEmpty"
  | "isNotEmpty";

type NumberFilterOp = "gt" | "lt" | "is" | "isNot" | "isEmpty" | "isNotEmpty";

type FilterOp = TextFilterOp | NumberFilterOp;

type FilterInput = {
  columnId: string;
  operator: FilterOp;
  value?: string | number;
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
  const windowSize = 300;
  const [startIndex, setStartIndex] = useState(0);

  const [sortInputs, setSortInputs] = useState<SortInput[]>([]);
  const [filterInputs, setFilterInputs] = useState<FilterInput[]>([]);

  const sortingState = useMemo<SortingState>(
    () => sortInputs.map(s => ({ id: s.columnId, desc: s.direction === "desc" })),
    [sortInputs]
  );

  const filtersForApi = useMemo(() => (filterInputs.length ? filterInputs : undefined), [filterInputs]);
  const sortForApi = useMemo(() => (sortInputs.length ? sortInputs : undefined), [sortInputs]);

  const { data, isLoading, isFetching } = api.table.getRows.useQuery({
    tableId,
    startIndex,
    windowSize,
    filters: filtersForApi,
    sort: sortForApi
  });

  const [lastData, setLastData] = useState<typeof data>();
  const [lastWindowStart, setLastWindowStart] = useState(0);

  useEffect(() => {
    if (data) {
      setLastData(data);
      setLastWindowStart(data.windowStart);
    }
  }, [data]);

  const effectiveData = data ?? lastData;
  const effectiveWindowStart = data?.windowStart ?? lastWindowStart;

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
    state: { sorting: sortingState },
    getCoreRowModel: getCoreRowModel(),
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

  const [openCol, setOpenCol] = useState<string | null>(null);

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
                      const colMeta = columnsMeta.find(c => c.id === header.column.id);
                      const isSorted = header.column.getIsSorted();

                      return (
                        <th key={header.id} className="border-b px-2 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="cursor-pointer select-none"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {isSorted === "asc" && " ▲"}
                              {isSorted === "desc" && " ▼"}
                            </span>

                              {colMeta && (
                                <ColumnMenu
                                  col={colMeta}
                                  openCol={openCol}
                                  setOpenCol={setOpenCol}
                                  sortInputs={sortInputs}
                                  setSortInputs={setSortInputs}
                                  filterInputs={filterInputs}
                                  setFilterInputs={setFilterInputs}
                                />
                              )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {virtualRows.map(vRow => {
                  const absoluteIndex = vRow.index;
                  const rel = absoluteIndex - effectiveWindowStart;

                  const row =
                    rel >= 0 && rel < table.getRowModel().rows.length
                      ? table.getRowModel().rows[rel]
                      : null;

                  if (!row) {
                    return (
                      <tr key={`placeholder-${absoluteIndex}`} className="h-6 border-b">
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
                    <tr key={row.original.id} className="h-6 border-b">
                      <td className="px-2 text-right text-[11px] text-gray-500">
                        {absoluteIndex + 1}
                      </td>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

  function ColumnMenu(props: {
    col: ColumnMeta;
    openCol: string | null;
    setOpenCol: React.Dispatch<React.SetStateAction<string | null>>;
    sortInputs: SortInput[];
    setSortInputs: React.Dispatch<React.SetStateAction<SortInput[]>>;
    filterInputs: FilterInput[];
    setFilterInputs: React.Dispatch<React.SetStateAction<FilterInput[]>>;
  }) {
    const isNumber = props.col.type === "number";

    const currentSort: SortDirection =
      props.sortInputs.find(s => s.columnId === props.col.id)?.direction ?? "none";
    const currentFilter = props.filterInputs.find(f => f.columnId === props.col.id);
    const currentOp = currentFilter?.operator ?? (isNumber ? ("gt" as FilterOp) : ("contains" as FilterOp));
    const needsValue = currentOp !== "isEmpty" && currentOp !== "isNotEmpty";

    const setSortDir = (dir: SortDirection) => {
      props.setSortInputs(prev => {
        const rest = prev.filter(s => s.columnId !== props.col.id);
        if (dir === "none") return rest;
        return [...rest, { columnId: props.col.id, direction: dir }];
      });
    };

    const setFilterOp = (op: FilterOp) => {
      props.setFilterInputs(prev => {
        const rest = prev.filter(f => f.columnId !== props.col.id);

        // treat "none" via clear button, not here
        if (op === "isEmpty" || op === "isNotEmpty") {
          return [...rest, { columnId: props.col.id, operator: op }];
        }

        const prevVal = prev.find(f => f.columnId === props.col.id)?.value;
        return [...rest, { columnId: props.col.id, operator: op, value: prevVal ?? "" }];
      });
    };

    const setFilterValue = (raw: string) => {
      props.setFilterInputs(prev => {
        const existing = prev.find(f => f.columnId === props.col.id);
        const op = existing?.operator ?? currentOp; // op is already FilterOp

        // if operator does not need a value, ignore input
        if (op === "isEmpty" || op === "isNotEmpty") return prev;

        const trimmed = raw.trim();
        if (!trimmed) return prev.filter(f => f.columnId !== props.col.id); // empty clears

        const parsed: string | number = isNumber ? Number(trimmed) : trimmed;
        if (isNumber && !Number.isFinite(parsed)) return prev;

        const rest = prev.filter(f => f.columnId !== props.col.id);
        return [...rest, { columnId: props.col.id, operator: op, value: parsed }];
      });
    };

    const clearFilter = () => props.setFilterInputs(prev => prev.filter(f => f.columnId !== props.col.id));
    const clearSort = () => setSortDir("none");

    const isOpen = props.openCol === props.col.id;
    const hasFilter = !!props.filterInputs.find(f => f.columnId === props.col.id);
    const hasSort = currentSort !== "none";

    return (
      <div className="relative inline-flex items-center gap-2">
        {(hasSort || hasFilter) && (
          <span className="text-[10px] text-gray-500">
            {hasSort ? (currentSort === "asc" ? "▲" : "▼") : ""}{hasFilter ? " •" : ""}
          </span>
        )}

        <button
          type="button"
          className="rounded border px-1 text-[11px] text-gray-600 hover:bg-gray-50"
          onClick={() => props.setOpenCol(v => (v === props.col.id ? null : props.col.id))}
        >
          ⋯
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded border bg-white p-2 shadow-lg">
            <div className="mb-2 text-[11px] font-medium text-gray-700">{props.col.name}</div>

            <div className="mb-2">
              <div className="mb-1 text-[10px] text-gray-500">Sort</div>
              <select
                className="h-7 w-full rounded border px-2 text-[11px]"
                value={currentSort}
                onChange={e => setSortDir(e.target.value as SortDirection)}
              >
                <option value="none">None</option>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>

              {hasSort && (
                <button
                  type="button"
                  className="mt-1 text-[10px] text-gray-500 hover:text-gray-700"
                  onClick={clearSort}
                >
                  Clear sort
                </button>
              )}
            </div>

            <div className="mb-2">
              <div className="mb-1 text-[10px] text-gray-500">Filter</div>

              <select
                className="h-7 w-full rounded border px-2 text-[11px]"
                value={currentFilter?.operator ?? ""}
                onChange={e => setFilterOp(e.target.value as FilterOp)}
              >
                <option value="" disabled>
                  Select…
                </option>

                {!isNumber && (
                  <>
                    <option value="contains">Contains</option>
                    <option value="doesNotContain">Does not contain</option>
                  </>
                )}

                <option value="is">Is</option>
                <option value="isNot">Is not</option>
                {isNumber && (
                  <>
                    <option value="gt">Greater than</option>
                    <option value="lt">Less than</option>
                  </>
                )}
                <option value="isEmpty">Is empty</option>
                <option value="isNotEmpty">Is not empty</option>
              </select>

              {needsValue && (
                <input
                  className="mt-2 h-7 w-full rounded border px-2 text-[11px]"
                  type={isNumber ? "number" : "text"}
                  value={String(currentFilter?.value ?? "")}
                  onChange={e => setFilterValue(e.target.value)}
                  placeholder="Value…"
                />
              )}

              {hasFilter && (
                <button
                  type="button"
                  className="mt-1 text-[10px] text-gray-500 hover:text-gray-700"
                  onClick={clearFilter}
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="rounded bg-gray-100 px-2 py-1 text-[11px] hover:bg-gray-200"
                onClick={() => props.setOpenCol(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }