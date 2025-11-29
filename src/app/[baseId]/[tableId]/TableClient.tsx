"use client"

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Row,
} from "@tanstack/react-table"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { api } from "~/trpc/react"
import GridHeader from "~/app/[baseId]/[tableId]/_components/GridHeader"
import GridBody from "~/app/[baseId]/[tableId]/_components/GridBody"
import { useWindowedRows } from "~/app/[baseId]/[tableId]/_components/useWindowedRows"

export type ColumnMeta = { id: string; name: string; type: string }
export type RowData = {
  id: string
  tableId: string
  index: number
  values: unknown
  createdAt: Date | null
}
export type TableClientProps = { tableId: string; columnsMeta: ColumnMeta[] }

type TextFilterOp = "contains" | "doesNotContain" | "is" | "isNot" | "isEmpty" | "isNotEmpty"
type NumberFilterOp = "gt" | "lt" | "is" | "isNot" | "isEmpty" | "isNotEmpty"
type FilterOp = TextFilterOp | NumberFilterOp
type FilterInput = { columnId: string; operator: FilterOp; value?: string | number }
type SortInput = { columnId: string; direction: "asc" | "desc" }

export type SaveState = "idle" | "queued" | "saving" | "saved" | "error"

export const BORDER_PX = 0.667
export const BORDER_COLOR = "#dde1e3"
export const DIVIDER_BORDER = "#d1d1d1"

export const ROW_H = 32
export const ROW_GUTTER_W = 63.33
export const PRIMARY_COL_W = 180
export const LEFT_PANE_W = 243.33 // gutter + primary
export const RIGHT_COL_W = 180

export const GUTTER_COL: ColumnMeta = { id: "__gutter__", name: "#", type: "gutter" }

export default function TableClient({ tableId, columnsMeta }: TableClientProps) {
  const windowSize = 300
  const [startIndex, setStartIndex] = useState(0)

  const [sortInputs, setSortInputs] = useState<SortInput[]>([])
  const [filterInputs, setFilterInputs] = useState<FilterInput[]>([])

  const sortingState = useMemo<SortingState>(
    () => sortInputs.map(s => ({ id: s.columnId, desc: s.direction === "desc" })),
    [sortInputs],
  )

  const filtersForApi = useMemo(
    () => (filterInputs.length ? filterInputs : undefined),
    [filterInputs],
  )
  const sortForApi = useMemo(() => (sortInputs.length ? sortInputs : undefined), [sortInputs])

  const { data, isFetching } = api.table.getRows.useQuery({
    tableId,
    startIndex,
    windowSize,
    filters: filtersForApi,
    sort: sortForApi,
  })

  const [lastData, setLastData] = useState<typeof data>()
  const [lastWindowStart, setLastWindowStart] = useState(0)

  useEffect(() => {
    if (data) {
      setLastData(data)
      setLastWindowStart(data.windowStart)
    }
  }, [data])

  const effectiveData = data ?? lastData
  const effectiveWindowStart = data?.windowStart ?? lastWindowStart
  const rowsData = (effectiveData?.rows ?? []) as RowData[]
  const totalCount = effectiveData?.totalCount ?? 0

  // column menu open state
  const [columnsMetaState, setColumnsMetaState] = useState(columnsMeta)
  useEffect(() => setColumnsMetaState(columnsMeta), [columnsMeta])

  const columns = useMemo<ColumnDef<RowData>[]>(
    () =>
      columnsMetaState.map(col => ({
        id: col.id,
        header: col.name,
        accessorFn: (row: RowData) => {
          const vals = row.values as Record<string, unknown> | null
          return vals?.[col.id]
        },
      })),
    [columnsMetaState],
  )


  const createColumn = api.table.createColumn.useMutation({
    onSuccess: async (col) => {
      // append locally so UI updates immediately
      if (!col) return
      setColumnsMetaState((prev) => [...prev, { id: col.id, name: col.name, type: col.type }])

      // optional: if your server loader depends on columns, also refresh invalidations
      await utils.table.getRows.invalidate()
    },
  })

  const primaryCol = columnsMetaState[0] ?? null
  const rightCols = columnsMetaState.slice(1)

  const table = useReactTable<RowData>({
    data: rowsData,
    columns,
    state: { sorting: sortingState },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
  })

  // vertical scroll container
  const yScrollRef = useRef<HTMLDivElement | null>(null)

  const { rowVirtualizer, virtualRows, paddingTop, paddingBottom } = useWindowedRows({
    totalCount,
    startIndex,
    setStartIndex,
    windowSize,
    isFetching,
    rowHeight: ROW_H,
    scrollRef: yScrollRef,
  })


  const [openCol, setOpenCol] = useState<string | null>(null)

  // create row / column
  const utils = api.useUtils()

  const [, setPendingFocus] = useState<null | { rowKey: string; colId: string }>(null)

  const createRow = api.table.createRow.useMutation({
    onSuccess: async (created) => {
      // move window to include new row (append behaviour)
      if (!created) return
      const newAbsIndex = created.index
      const newStart = Math.max(0, newAbsIndex - Math.floor(windowSize / 2))
      setStartIndex(newStart)

      await utils.table.getRows.invalidate()

      // ask GridBody to focus primary cell once it exists in DOM
      if (primaryCol) setPendingFocus({ rowKey: created.id, colId: primaryCol.id })
    },
  })

  // horizontal scroll sync for header
  const [rightScrollLeft, setRightScrollLeft] = useState(0)
  const onRightScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setRightScrollLeft(e.currentTarget.scrollLeft)
  }, [])

  const toggleSort = useCallback((columnId: string) => {
    setSortInputs(prev => {
      const current = prev.find(s => s.columnId === columnId)?.direction ?? "none"
      const rest = prev.filter(s => s.columnId !== columnId)
      if (current === "none") return [...rest, { columnId, direction: "asc" }]
      if (current === "asc") return [...rest, { columnId, direction: "desc" }]
      return rest
    })
  }, [])

  // ------------ editing (centralised so edits survive unmount while virtualising) ------------
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const draftsRef = useRef(drafts)
  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({})

  useEffect(() => {
    const timeouts = timeoutsRef.current

    return () => {
      for (const t of Object.values(timeouts)) {
        if (t) clearTimeout(t)
      }
    }
  }, [])

  const updateCell = api.table.updateCell.useMutation({
    onSuccess: (_data, vars) => {
      const key = `${vars.rowId}:${vars.columnId}`
      setSaveState(prev => ({ ...prev, [key]: "saved" }))
    },
    onError: (_err, vars) => {
      const key = `${vars.rowId}:${vars.columnId}`
      setSaveState(prev => ({ ...prev, [key]: "error" }))
    },
  })

  const hasDraft = (key: string) =>
    Object.prototype.hasOwnProperty.call(draftsRef.current, key)

  const commitCell = useCallback(
    (rowId: string, columnId: string) => {
      const key = `${rowId}:${columnId}`

      // ✅ If the user never edited this cell, do NOT write anything.
      if (!hasDraft(key)) return

      const raw = draftsRef.current[key] ?? ""

      setSaveState((prev) => ({ ...prev, [key]: "saving" }))
      updateCell.mutate({ rowId, columnId, value: raw })
    },
    [updateCell],
  )

  const queueCommit = useCallback(
    (rowId: string, columnId: string) => {
      const key = `${rowId}:${columnId}`

      const existing = timeoutsRef.current[key]
      if (existing) clearTimeout(existing)

      setSaveState(prev => ({ ...prev, [key]: "queued" }))

      timeoutsRef.current[key] = setTimeout(() => {
        commitCell(rowId, columnId)
      }, 500)
    },
    [commitCell],
  )

  const flushCommit = useCallback(
    (rowId: string, columnId: string) => {
      const key = `${rowId}:${columnId}`
      const existing = timeoutsRef.current[key]
      if (existing) clearTimeout(existing)
      timeoutsRef.current[key] = undefined
      commitCell(rowId, columnId)
    },
    [commitCell],
  )

  const anySaving = Object.values(saveState).some(s => s === "queued" || s === "saving")
  const anyError = Object.values(saveState).some(s => s === "error")

  const setDraft = useCallback((rowId: string, colId: string, next: string) => {
    setDrafts(prev => ({ ...prev, [`${rowId}:${colId}`]: next }))
  }, [])

  const getCellString = useCallback(
    (row: Row<RowData> | undefined, rowId: string, col: ColumnMeta) => {
      if (col.id === "__gutter__") return ""

      const key = `${rowId}:${col.id}`
      const draft = drafts[key]
      if (draft !== undefined) return draft

      const v = row?.getValue(col.id)

      if (v === null || v === undefined) return ""

      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        return String(v)
      }

      // Fallback for objects/arrays/etc – choose what you prefer:
      // return JSON.stringify(v)
      return ""
    },
    [drafts],
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-4 items-center justify-end px-3 text-[11px] text-neutral-600 bg-yellow-100 border-b">
        {anyError ? "Some changes failed to save" : anySaving ? "Saving…" : "All changes saved"}
      </div>

      <GridHeader
        primaryCol={primaryCol}
        rightCols={rightCols}
        rightScrollLeft={rightScrollLeft}
        getIsSorted={(colId) => table.getColumn(colId)?.getIsSorted() ?? false}
        toggleSort={toggleSort}
        openCol={openCol}
        setOpenCol={setOpenCol}
        sortInputs={sortInputs}
        setSortInputs={setSortInputs}
        filterInputs={filterInputs}
        setFilterInputs={setFilterInputs}
        onCreateColumn={(payload) =>
          createColumn.mutate({ tableId, ...payload })
        }
        creatingColumn={createColumn.isPending}
      />

      <GridBody
        yScrollRef={yScrollRef}
        onRightScroll={onRightScroll}
        effectiveWindowStart={effectiveWindowStart}
        tableRows={table.getRowModel().rows}
        primaryCol={primaryCol}
        rightCols={rightCols}
        virtualRows={virtualRows}
        totalSize={rowVirtualizer.getTotalSize()}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        getCellString={getCellString}
        setDraft={setDraft}
        queueCommit={queueCommit}
        flushCommit={flushCommit}
        onCreateRowClick={() => createRow.mutate({ tableId })}
        creatingRow={createRow.isPending}
      />
    </div>
  )
}