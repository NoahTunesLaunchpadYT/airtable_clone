// app/[baseId]/[tableId]/_components/useWindowedRows.ts
"use client"

import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect } from "react"

export function useWindowedRows(opts: {
  totalCount: number
  extraRowCount?: number
  startIndex: number
  setStartIndex: (n: number) => void
  windowSize: number
  isFetching: boolean
  rowHeight: number
  scrollRef: React.RefObject<HTMLDivElement | null>
}) {
  const extra = opts.extraRowCount ?? 0
  const virtualCount = opts.totalCount + extra

  const rowVirtualizer = useVirtualizer({
    count: virtualCount,
    getScrollElement: () => opts.scrollRef.current,
    estimateSize: () => opts.rowHeight,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const firstVirtual = virtualRows[0]
  const lastVirtual = virtualRows[virtualRows.length - 1]
  const paddingTop = firstVirtual?.start ?? 0
  const paddingBottom = lastVirtual ? rowVirtualizer.getTotalSize() - lastVirtual.end : 0

  useEffect(() => {
    if (virtualRows.length === 0 || opts.totalCount === 0) return
    if (opts.isFetching) return

    const first = virtualRows[0]
    const last = virtualRows[virtualRows.length - 1]
    if (!first || !last) return

    // Ignore the extra control row (the + row)
    const firstIndex = Math.min(first.index, opts.totalCount - 1)
    const lastIndex = Math.min(last.index, opts.totalCount - 1)

    const windowEnd = opts.startIndex + opts.windowSize
    const buffer = Math.floor(opts.windowSize / 4)

    const needShiftUp = firstIndex < opts.startIndex + buffer && opts.startIndex > 0
    const needShiftDown = lastIndex > windowEnd - buffer && windowEnd < opts.totalCount
    if (!needShiftUp && !needShiftDown) return

    const visibleCenter = Math.floor((firstIndex + lastIndex) / 2)
    let newStart = visibleCenter - Math.floor(opts.windowSize / 2)

    if (newStart < 0) newStart = 0
    const maxStart = Math.max(0, opts.totalCount - opts.windowSize)
    if (newStart > maxStart) newStart = maxStart

    if (newStart !== opts.startIndex) opts.setStartIndex(newStart)
  }, [virtualRows, opts])

  return { rowVirtualizer, virtualRows, paddingTop, paddingBottom }
}
