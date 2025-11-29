"use client"

import React from "react"
import { ColumnMenu } from "~/app/[baseId]/[tableId]/_components/ColumnMenu"
import {
  BORDER_COLOR,
  BORDER_PX,
  DIVIDER_BORDER,
  GUTTER_COL,
  LEFT_PANE_W,
  PRIMARY_COL_W,
  RIGHT_COL_W,
  ROW_GUTTER_W,
  ROW_H,
  type ColumnMeta,
} from "~/app/[baseId]/[tableId]/TableClient"

const CREATE_COL_W = 94

type TextFilterOp = "contains" | "doesNotContain" | "is" | "isNot" | "isEmpty" | "isNotEmpty"
type NumberFilterOp = "gt" | "lt" | "is" | "isNot" | "isEmpty" | "isNotEmpty"
type FilterOp = TextFilterOp | NumberFilterOp
type FilterInput = { columnId: string; operator: FilterOp; value?: string | number }
type SortInput = { columnId: string; direction: "asc" | "desc" }

export default function GridHeader(props: {
  primaryCol: ColumnMeta | null
  rightCols: ColumnMeta[]
  rightScrollLeft: number
  getIsSorted: (colId: string) => false | "asc" | "desc"
  toggleSort: (colId: string) => void
  openCol: string | null
  setOpenCol: React.Dispatch<React.SetStateAction<string | null>>
  sortInputs: SortInput[]
  setSortInputs: React.Dispatch<React.SetStateAction<SortInput[]>>
  filterInputs: FilterInput[]
  setFilterInputs: React.Dispatch<React.SetStateAction<FilterInput[]>>
  // NEW:
  onCreateColumn: (args: { name: string; type: "text" | "number" }) => void
  creatingColumn: boolean
}) {
  // NEW: small bit of local state for the create-column popover
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newColName, setNewColName] = React.useState("")
  const [newColType, setNewColType] = React.useState<"text" | "number">("text")

  return (
    <div
      className="relative z-[40] flex"
      style={{ borderBottom: `${BORDER_PX}px solid ${DIVIDER_BORDER}` }}
    >
      {/* left header */}
      <div
        className="flex flex-none items-stretch bg-white"
        style={{
          width: LEFT_PANE_W,
          borderRight: `${BORDER_PX}px solid ${DIVIDER_BORDER}`,
        }}
      >
        <div
          className="flex items-center justify-end pr-2 text-[11px] text-gray-500"
          style={{ width: ROW_GUTTER_W, height: ROW_H }}
        >
          {GUTTER_COL.name}
        </div>

        <div
          className="flex min-w-0 items-center justify-between gap-2 px-2"
          style={{ width: PRIMARY_COL_W, height: ROW_H }}
        >
          <div
            className="min-w-0 cursor-pointer select-none truncate text-[12px] font-semibold text-gray-700"
            onClick={() => props.primaryCol && props.toggleSort(props.primaryCol.id)}
          >
            {props.primaryCol?.name ?? ""}
            {props.primaryCol && props.getIsSorted(props.primaryCol.id) === "asc" ? " ▲" : ""}
            {props.primaryCol && props.getIsSorted(props.primaryCol.id) === "desc" ? " ▼" : ""}
          </div>

          {props.primaryCol && (
            <ColumnMenu
              col={props.primaryCol}
              openCol={props.openCol}
              setOpenCol={props.setOpenCol}
              sortInputs={props.sortInputs}
              setSortInputs={props.setSortInputs}
              filterInputs={props.filterInputs}
              setFilterInputs={props.setFilterInputs}
            />
          )}
        </div>
      </div>

      {/* right header (masked, syncs to body scrollLeft) */}
      <div
        className="relative min-w-0 flex-1"
      >
        <div
          className="flex"
          style={{
            // 👇 add the create-column width so it sits AFTER the last column
            width: props.rightCols.length * RIGHT_COL_W + CREATE_COL_W,
            transform: `translateX(${-props.rightScrollLeft}px)`,
          }}
        >
          {props.rightCols.map(col => {
            const isSorted = props.getIsSorted(col.id)
            return (
              <div
                key={col.id}
                className="flex min-w-0 items-center justify-between gap-2 px-2"
                style={{
                  width: RIGHT_COL_W,
                  height: ROW_H,
                  borderRight: `${BORDER_PX}px solid ${BORDER_COLOR}`,
                  background: "white",
                }}
              >
                <div
                  className="min-w-0 cursor-pointer select-none truncate text-[12px] font-semibold text-gray-700"
                  onClick={() => props.toggleSort(col.id)}
                >
                  {col.name}
                  {isSorted === "asc" && " ▲"}
                  {isSorted === "desc" && " ▼"}
                </div>

                <ColumnMenu
                  col={col}
                  openCol={props.openCol}
                  setOpenCol={props.setOpenCol}
                  sortInputs={props.sortInputs}
                  setSortInputs={props.setSortInputs}
                  filterInputs={props.filterInputs}
                  setFilterInputs={props.setFilterInputs}
                />
              </div>
            )
          })}

          {/* 👇 Add-field cell lives INSIDE the scrolling flex, after last col */}
          <div
            className="relative flex items-center bg-white"
            style={{
              width: CREATE_COL_W,
              height: ROW_H,
              borderRight: `${BORDER_PX}px solid ${BORDER_COLOR}`,
            }}
          >
            <button
              type="button"
              className="h-full w-full px-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-50"
              onClick={() => setIsCreateOpen(v => !v)}
              disabled={props.creatingColumn}
            >
              + Add field
            </button>

            {isCreateOpen && (
              <div className="absolute right-0 top-full z-[9999] mt-1 w-64 rounded border bg-white p-2 shadow-lg">
                <div className="mb-2 text-[11px] font-semibold text-neutral-700">
                  Create field
                </div>

                <label className="mb-1 block text-[10px] text-neutral-500">Type</label>
                <select
                  className="h-8 w-full rounded border px-2 text-[12px]"
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as "text" | "number")}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>

                <label className="mb-1 mt-2 block text-[10px] text-neutral-500">
                  Name
                </label>
                <input
                  className="h-8 w-full rounded border px-2 text-[12px]"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Field name"
                />

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    className="h-8 rounded px-2 text-[12px] hover:bg-neutral-100"
                    onClick={() => {
                      setIsCreateOpen(false)
                      setNewColName("")
                      setNewColType("text")
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="h-8 rounded bg-neutral-900 px-3 text-[12px] text-white hover:bg-neutral-800 disabled:opacity-50"
                    disabled={!newColName.trim() || props.creatingColumn}
                    onClick={() => {
                      const name = newColName.trim()
                      if (!name) return
                      props.onCreateColumn({ name, type: newColType })
                      setIsCreateOpen(false)
                      setNewColName("")
                      setNewColType("text")
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
