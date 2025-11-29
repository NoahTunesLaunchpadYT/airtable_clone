
"use client"

type ColumnMeta = {
  id: string;
  name: string;
  type: string;
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

export function ColumnMenu(props: {
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
        <div className="absolute right-0 top-full z-[9999] mt-1 w-64 rounded border bg-white p-2 shadow-lg">
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