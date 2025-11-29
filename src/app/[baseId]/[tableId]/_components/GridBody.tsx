"use client"

import React, { useMemo, useState, useRef, useCallback } from "react"
import type { Row } from "@tanstack/react-table"
import EditableCell from "./EditableCell"
import {
  BORDER_COLOR,
  BORDER_PX,
  DIVIDER_BORDER,
  LEFT_PANE_W,
  PRIMARY_COL_W,
  RIGHT_COL_W,
  ROW_GUTTER_W,
  ROW_H,
  type ColumnMeta,
  type RowData,
} from "~/app/[baseId]/[tableId]/TableClient"

type SelectedCell = {
  rowKey: string
  rowId: string
  colId: string
  pane: "left" | "right"
  rightColIndex?: number
  absoluteIndex: number
}

const CURSOR_COLOR = "#166ee1"
const CURSOR_PX = 2

const cursorOverlayStyle = (_opts: { cutTop?: boolean; cutLeft?: boolean; cutRight?: boolean }) =>
  ({
    boxShadow: `0 0 0 ${CURSOR_PX}px ${CURSOR_COLOR}`,
    borderRadius: 1,
  }) as const

const isPrintableKey = (e: React.KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return false
  return e.key.length === 1
}

const safeId = (s: string) => encodeURIComponent(s).replace(/%/g, "_")
const cellDomId = (rowKey: string, colId: string) => `cell_${safeId(rowKey)}_${safeId(colId)}`
const cellKey = (rowKey: string, colId: string) => `${rowKey}::${colId}`

export default function GridBody(props: {
  yScrollRef: React.RefObject<HTMLDivElement | null>
  onRightScroll: (e: React.UIEvent<HTMLDivElement>) => void

  effectiveWindowStart: number
  tableRows: Row<RowData>[]

  primaryCol: ColumnMeta | null
  rightCols: ColumnMeta[]

  virtualRows: Array<{ index: number; start: number; end: number }>
  totalSize: number
  paddingTop: number
  paddingBottom: number

  getCellString: (row: Row<RowData> | undefined, rowId: string, col: ColumnMeta) => string
  setDraft: (rowId: string, colId: string, next: string) => void
  queueCommit: (rowId: string, colId: string, colType: string) => void
  flushCommit: (rowId: string, colId: string, colType: string) => void

  // NEW:
  onCreateRowClick: () => void
  creatingRow: boolean
}) {
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<SelectedCell | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const rightScrollRef = useRef<HTMLDivElement | null>(null)

  // This is the real number of data rows (no + row)
  const totalCount = useMemo(
    () => Math.max(0, Math.floor(props.totalSize / ROW_H)),
    [props.totalSize],
  )

  const cellBorder = useMemo(
    () =>
      ({
        borderBottom: `${BORDER_PX}px solid ${BORDER_COLOR}`,
        height: ROW_H,
      }) as const,
    [],
  )

  const rowHighlightBg = "var(--colors-background-subtler, rgba(0,0,0,0.03))"

  const getRowForAbsIndex = useCallback(
    (absIndex: number): Row<RowData> | undefined => {
      const rel = absIndex - props.effectiveWindowStart
      return rel >= 0 && rel < props.tableRows.length ? props.tableRows[rel] : undefined
    },
    [props.effectiveWindowStart, props.tableRows],
  )

  const focusSelected = useCallback(
    (rowKey: string, colId: string, mode: "selected" | "editing") => {
      requestAnimationFrame(() => {
        const el = document.getElementById(cellDomId(rowKey, colId)) as HTMLInputElement | null
        if (!el) return

        el.focus({ preventScroll: true })

        if (mode === "selected") {
          // show start of content
          el.scrollLeft = 0
          el.setSelectionRange?.(0, 0)
        } else {
          const len = el.value?.length ?? 0
          el.setSelectionRange?.(len, len)
        }
      })
    },
    [],
  )

  const ensureVisible = useCallback(
    (absIndex: number, colPos: number) => {
      // vertical
      const yEl = props.yScrollRef.current
      if (yEl) {
        const rowTop = absIndex * ROW_H
        const rowBottom = rowTop + ROW_H
        const viewTop = yEl.scrollTop
        const viewBottom = viewTop + yEl.clientHeight

        if (rowTop < viewTop) yEl.scrollTo({ top: rowTop })
        else if (rowBottom > viewBottom) yEl.scrollTo({ top: rowBottom - yEl.clientHeight })
      }

      // horizontal (right only)
      const xEl = rightScrollRef.current
      if (xEl && colPos > 0) {
        const leftX = (colPos - 1) * RIGHT_COL_W
        const rightX = leftX + RIGHT_COL_W
        const viewL = xEl.scrollLeft
        const viewR = viewL + xEl.clientWidth

        if (leftX < viewL) xEl.scrollTo({ left: leftX })
        else if (rightX > viewR) xEl.scrollTo({ left: rightX - xEl.clientWidth })
      }
    },
    [props.yScrollRef],
  )

  const selectByPosition = useCallback(
    (absIndex: number, colPos: number) => {
      if (!props.primaryCol) return
      if (absIndex < 0 || absIndex >= totalCount) return
      if (colPos < 0 || colPos > props.rightCols.length) return

      const row = getRowForAbsIndex(absIndex)
      const rowId = (row?.original?.id ?? "")
      const rowKey = rowId || `abs:${absIndex}`

      const isPrimary = colPos === 0
      const col = isPrimary ? props.primaryCol : props.rightCols[colPos - 1]
      if (!col) return

      setEditingKey(null) //  moving selection exits edit mode
      setSelected({
        rowKey,
        rowId,
        colId: col.id,
        pane: isPrimary ? "left" : "right",
        rightColIndex: isPrimary ? undefined : colPos - 1,
        absoluteIndex: absIndex,
      })

      ensureVisible(absIndex, colPos)
      focusSelected(rowKey, col.id, "selected")
    },
    [ensureVisible, focusSelected, getRowForAbsIndex, props.primaryCol, props.rightCols, totalCount],
  )

  const startEditReplace = useCallback(
    (rowKey: string, rowId: string, colId: string, colType: string, absIndex: number, colPos: number, nextValue: string) => {
      if (!rowId) return // can't edit unloaded rows
      const k = cellKey(rowKey, colId)
      setEditingKey(k)

      //  typing from selected mode replaces whole value
      props.setDraft(rowId, colId, nextValue)
      props.queueCommit(rowId, colId, colType)

      ensureVisible(absIndex, colPos)
      requestAnimationFrame(() => {
        const el = document.getElementById(cellDomId(rowKey, colId)) as HTMLInputElement | null
        if (!el) return
        el.focus({ preventScroll: true })
        const pos = nextValue.length
        el.setSelectionRange?.(pos, pos)
      })
    },
    [ensureVisible, props],
  )

  const exitEditAndMove = useCallback(
    (rowKey: string, rowId: string, colId: string, colType: string, absIndex: number, colPos: number, move: "down" | "right" | "left") => {
      if (rowId) props.flushCommit(rowId, colId, colType)
      setEditingKey(null)

      let nextRow = absIndex
      let nextCol = colPos
      if (move === "down") nextRow = absIndex + 1
      if (move === "right") nextCol = colPos + 1
      if (move === "left") nextCol = colPos - 1

      // no wrap
      if (nextRow < 0 || nextRow >= totalCount) return
      if (nextCol < 0 || nextCol > props.rightCols.length) return

      selectByPosition(nextRow, nextCol)
    },
    [props, selectByPosition, totalCount],
  )

  const handleSelectedKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, absIndex: number, colPos: number, rowKey: string, rowId: string, col: ColumnMeta) => {
      if (e.nativeEvent.isComposing) return

      // navigation in selected mode
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()

        let nextRow = absIndex
        let nextCol = colPos

        if (e.key === "ArrowUp") nextRow--
        if (e.key === "ArrowDown") nextRow++
        if (e.key === "ArrowLeft") nextCol--
        if (e.key === "ArrowRight") nextCol++
        if (e.key === "Enter") nextRow++
        if (e.key === "Tab") nextCol += e.shiftKey ? -1 : 1

        if (nextRow < 0 || nextRow >= totalCount) return
        if (nextCol < 0 || nextCol > props.rightCols.length) return

        selectByPosition(nextRow, nextCol)
        return
      }

      // typing in selected mode => enter edit mode and REPLACE
      if (isPrintableKey(e)) {
        e.preventDefault()
        startEditReplace(rowKey, rowId, col.id, col.type, absIndex, colPos, e.key)
        return
      }

      // Backspace/Delete in selected mode => enter edit mode and clear
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        startEditReplace(rowKey, rowId, col.id, col.type, absIndex, colPos, "")
      }
    },
    [props.rightCols.length, selectByPosition, startEditReplace, totalCount],
  )

  const handleEditingKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, absIndex: number, colPos: number, rowKey: string, rowId: string, col: ColumnMeta) => {
      if (e.nativeEvent.isComposing) return

      // In edit mode:
      // - arrows should move caret (default) => do nothing
      // - Enter / Tab should exit edit mode and move selection
      if (e.key === "Enter") {
        e.preventDefault()
        exitEditAndMove(rowKey, rowId, col.id, col.type, absIndex, colPos, "down")
        return
      }

      if (e.key === "Tab") {
        e.preventDefault()
        exitEditAndMove(rowKey, rowId, col.id, col.type, absIndex, colPos, e.shiftKey ? "left" : "right")
      }
    },
    [exitEditAndMove],
  )

  const handlePasteSelected = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, absIndex: number, colPos: number, rowKey: string, rowId: string, col: ColumnMeta) => {
      // paste in selected mode should also REPLACE and enter edit
      if (!rowId) return
      if (editingKey === cellKey(rowKey, col.id)) return

      const text = e.clipboardData.getData("text")
      if (!text) return

      e.preventDefault()
      startEditReplace(rowKey, rowId, col.id, col.type, absIndex, colPos, text)
    },
    [editingKey, startEditReplace],
  )

  return (
    <div
      ref={props.yScrollRef}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      onMouseLeave={() => setHoveredRowKey(null)}
    >
      <div className="flex">
        {/* left pane */}
        <div
          className="flex-none bg-white"
          style={{ width: LEFT_PANE_W, borderRight: `${BORDER_PX}px solid ${DIVIDER_BORDER}` }}
        >
          <div style={{ height: props.totalSize }}>
            <div style={{ height: props.paddingTop }} />

              {props.virtualRows.map((vRow) => {
                const absoluteIndex = vRow.index
                const rel = absoluteIndex - props.effectiveWindowStart
                const row: Row<RowData> | undefined =
                  rel >= 0 && rel < props.tableRows.length ? props.tableRows[rel] : undefined

                const rowId = row?.original.id ?? ""
                const rowKey = rowId || `abs:${absoluteIndex}`
                const primary = props.primaryCol
                const primaryId = primary?.id

              const isRowActive = hoveredRowKey === rowKey || selected?.rowKey === rowKey

              const isSelected =
                !!primaryId &&
                selected?.rowKey === rowKey &&
                selected.pane === "left" &&
                selected.colId === primaryId

              const isEditing = !!primaryId && editingKey === cellKey(rowKey, primaryId)

              return (
                <div
                  key={`L-${absoluteIndex}`}
                  className="flex"
                  style={{ height: ROW_H }}
                  onMouseEnter={() => setHoveredRowKey(rowKey)}
                >
                  {/* gutter */}
                  <div
                    className="flex items-center justify-end pr-2 text-[11px] text-gray-500"
                    style={{
                      ...cellBorder,
                      width: ROW_GUTTER_W,
                      backgroundColor: isRowActive ? rowHighlightBg : "white",
                    }}
                  >
                    {absoluteIndex + 1}
                  </div>

                  {/* primary */}
                  <div
                    className="relative flex items-center px-2"
                    style={{
                      ...cellBorder,
                      width: PRIMARY_COL_W,
                      backgroundColor: isRowActive && !isSelected ? rowHighlightBg : "white",
                      zIndex: isSelected ? 50 : 0,
                    }}
                  >
                    {isSelected && (
                      <div aria-hidden className="pointer-events-none absolute inset-0" style={cursorOverlayStyle({ cutTop: absoluteIndex === 0, cutRight: true })} />
                    )}

                    {!row || !rowId || !primary || !primaryId ? (
                      <span className="text-[12px] text-gray-400">Loading…</span>
                    ) : (
                      <EditableCell
                        id={cellDomId(rowKey, primaryId)}
                        value={props.getCellString(row, rowId, primary)}
                        isSelected={isSelected}
                        isEditing={isEditing}
                        onMouseDownSelect={() => {
                          setEditingKey(null)
                          setSelected({ rowKey, rowId, colId: primaryId, pane: "left", absoluteIndex })
                          focusSelected(rowKey, primaryId, "selected")
                        }}
                        onDoubleClickEdit={() => {
                          setSelected({ rowKey, rowId, colId: primaryId, pane: "left", absoluteIndex })
                          setEditingKey(cellKey(rowKey, primaryId))
                          focusSelected(rowKey, primaryId, "editing")
                        }}
                        onKeyDown={(e) =>
                          isEditing
                            ? handleEditingKeyDown(e, absoluteIndex, 0, rowKey, rowId, primary)
                            : handleSelectedKeyDown(e, absoluteIndex, 0, rowKey, rowId, primary)
                        }
                        onPaste={(e) => handlePasteSelected(e, absoluteIndex, 0, rowKey, rowId, primary)}
                        onChange={(next) => {
                          if (!isEditing) return
                          props.setDraft(rowId, primaryId, next)
                          props.queueCommit(rowId, primaryId, primary.type)
                        }}
                        onBlurEditing={() => {
                          // click-away save + exit edit
                          props.flushCommit(rowId, primaryId, primary.type)
                          setEditingKey(null)
                          focusSelected(rowKey, primaryId, "selected")
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}

            <div style={{ height: props.paddingBottom }} />
            
            {/* NEW: create-row control (left pane) */}
            <div
              className="flex cursor-pointer select-none"
              style={{ height: ROW_H }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={props.onCreateRowClick}
            >
              <div
                className="flex items-center justify-end pr-2 text-[11px] text-neutral-600"
                style={{ ...cellBorder, width: ROW_GUTTER_W }}
              >
                +
              </div>

              <div
                className="flex items-center px-2 text-[12px] text-neutral-700"
                style={{ ...cellBorder, width: PRIMARY_COL_W }}
              >
                {props.creatingRow ? "Creating…" : "Add new record"}
              </div>
            </div>
          </div>
        </div>

        {/* right pane */}
        <div
          ref={rightScrollRef}
          className="min-w-0 flex-1 overflow-x-auto"
          style={{ overflowY: "visible" }}
          onScroll={props.onRightScroll}
        >
          <div style={{ width: props.rightCols.length * RIGHT_COL_W }}>
            <div style={{ height: props.totalSize }}>
              <div style={{ height: props.paddingTop }} />

                {props.virtualRows.map((vRow) => {
                  const absoluteIndex = vRow.index
                  const rel = absoluteIndex - props.effectiveWindowStart
                  const row: Row<RowData> | undefined =
                    rel >= 0 && rel < props.tableRows.length ? props.tableRows[rel] : undefined

                  const rowId = row?.original.id ?? ""
                  const rowKey = rowId || `abs:${absoluteIndex}`

                const isRowActive = hoveredRowKey === rowKey || selected?.rowKey === rowKey

                return (
                  <div
                    key={`R-${absoluteIndex}`}
                    className="flex"
                    style={{ height: ROW_H }}
                    onMouseEnter={() => setHoveredRowKey(rowKey)}
                  >
                    {props.rightCols.map((col, idx) => {
                      const colPos = idx + 1
                      const isSelected =
                        !!rowId &&
                        selected?.rowKey === rowKey &&
                        selected.pane === "right" &&
                        selected.colId === col.id

                      const isEditing = editingKey === cellKey(rowKey, col.id)

                      return (
                        <div
                          key={`${rowKey}:${col.id}`}
                          className="relative flex items-center px-2"
                          style={{
                            ...cellBorder,
                            width: RIGHT_COL_W,
                            borderRight: `${BORDER_PX}px solid ${BORDER_COLOR}`,
                            backgroundColor: isRowActive && !isSelected ? rowHighlightBg : "white",
                            zIndex: isSelected ? 50 : 0,
                          }}
                        >
                          {isSelected && (
                            <div aria-hidden className="pointer-events-none absolute inset-0" style={cursorOverlayStyle({ cutTop: absoluteIndex === 0, cutLeft: idx === 0 })} />
                          )}

                          {!row || !rowId ? (
                            <span className="text-[12px] text-gray-400">Loading…</span>
                          ) : (
                            <EditableCell
                              id={cellDomId(rowKey, col.id)}
                              value={props.getCellString(row, rowId, col)}
                              isSelected={isSelected}
                              isEditing={isEditing}
                              onMouseDownSelect={() => {
                                setEditingKey(null)
                                setSelected({ rowKey, rowId, colId: col.id, pane: "right", rightColIndex: idx, absoluteIndex })
                                focusSelected(rowKey, col.id, "selected")
                              }}
                              onDoubleClickEdit={() => {
                                setSelected({ rowKey, rowId, colId: col.id, pane: "right", rightColIndex: idx, absoluteIndex })
                                setEditingKey(cellKey(rowKey, col.id))
                                focusSelected(rowKey, col.id, "editing")
                              }}
                              onKeyDown={(e) =>
                                isEditing
                                  ? handleEditingKeyDown(e, absoluteIndex, colPos, rowKey, rowId, col)
                                  : handleSelectedKeyDown(e, absoluteIndex, colPos, rowKey, rowId, col)
                              }
                              onPaste={(e) => handlePasteSelected(e, absoluteIndex, colPos, rowKey, rowId, col)}
                              onChange={(next) => {
                                if (!isEditing) return
                                props.setDraft(rowId, col.id, next)
                                props.queueCommit(rowId, col.id, col.type)
                              }}
                              onBlurEditing={() => {
                                props.flushCommit(rowId, col.id, col.type)
                                setEditingKey(null)
                                focusSelected(rowKey, col.id, "selected")
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              <div style={{ height: props.paddingBottom }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
