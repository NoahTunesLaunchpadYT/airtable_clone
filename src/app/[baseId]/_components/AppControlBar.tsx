import React from "react"
import Link from "next/link"
import { ChevronDown, Plus } from "lucide-react"

type TableTab = { id: string; name: string }

export function AppControlsBar(props: {
  baseId: string
  tableId: string
  tables: TableTab[]
}) {
  return (
    <div className="h-8 border-b bg-neutral-50">
      <div className="flex h-full items-stretch gap-1 px-2">
        <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto">
          {props.tables.map(t => {
            const active = t.id === props.tableId
            return (
              <Link
                key={t.id}
                href={`/${props.baseId}/${t.id}`}
                className={[
                  "relative flex h-full items-center rounded-t-md px-3 text-sm",
                  active
                    ? "bg-white font-semibold shadow-sm"
                    : "text-neutral-700 hover:bg-white/60",
                ].join(" ")}
              >
                <span className="truncate">{t.name}</span>
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-900" />
                )}
              </Link>
            )
          })}
        </div>

        <IconButton label="All tables">
          <ChevronDown className="h-4 w-4" />
        </IconButton>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 text-sm text-neutral-800 hover:bg-neutral-100"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add or import</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 text-sm text-neutral-800 hover:bg-neutral-100"
        >
          <span>Tools</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function IconButton(props: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100"
    >
      {props.children}
    </button>
  )
}
