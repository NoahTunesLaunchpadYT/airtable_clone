// app/[baseId]/[tableId]/TableShell.tsx

import {
  ChevronDown,
  List,
  Search,
  Plus,
  LayoutGrid,
  EyeOff,
  Filter,
  Group,
  ArrowUpDown,
  Palette,
  Rows3,
  ExternalLink,
  Settings,
} from "lucide-react"
import TableClient from "~/app/[baseId]/[tableId]/TableClient"
import { UniversalLeftStatusBar } from "~/app/[baseId]/_components/UniversalLeftStatusBar"
import { AppTopBar } from "~/app/[baseId]/_components/AppTopBar"
import { AppControlsBar } from "~/app/[baseId]/_components/AppControlBar"

type ColumnMeta = {
  id: string
  name: string
  type: string
}

type TableMeta = {
  id: string
  name: string
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

export default function TableShell(props: {
  baseId: string
  tableId: string
  tables: TableMeta[]
  columnsMeta: ColumnMeta[]
  baseName: string
  baseColor: string
}) {
  return (
    <div className="flex h-screen w-screen">
      {/* Universal left bar */}
      <div className="shrink-0">
        <UniversalLeftStatusBar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar 
        baseId={props.baseId} 
          tableId={props.tableId} 
          tables={props.tables} 
          columnsMeta={props.columnsMeta} 
          baseName={props.baseName}
          baseColor={props.baseColor}
          />

        <AppControlsBar
          baseId={props.baseId}
          tableId={props.tableId}
          tables={props.tables}
        />

        {/* Main table region */}
        <div className="flex-1 min-h-0">
          <div
            className="h-full"
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gridTemplateRows: "48px 1fr",
            }}
          >
            {/* View bar (spans both columns) */}
            <div className="col-span-2 flex h-12 items-center gap-2 border-b bg-white px-3">
              <IconButton label="Toggle sidebar">
                <List className="h-4 w-4" />
              </IconButton>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold hover:bg-neutral-100"
              >
                <LayoutGrid className="h-4 w-4 text-blue-600" />
                <span className="max-w-[200px] truncate">Grid view</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="ml-auto flex items-center gap-2">
                <PillButton icon={<EyeOff className="h-4 w-4" />} label="Hide fields" />
                <PillButton icon={<Filter className="h-4 w-4" />} label="Filter" />
                <PillButton icon={<Group className="h-4 w-4" />} label="Group" />
                <PillButton icon={<ArrowUpDown className="h-4 w-4" />} label="Sort" />
                <PillButton icon={<Palette className="h-4 w-4" />} label="Colour" />
                <PillButton icon={<Rows3 className="h-4 w-4" />} label="" />
                <PillButton icon={<ExternalLink className="h-4 w-4" />} label="Share and sync" />

                <IconButton label="Find in view">
                  <Search className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            {/* Left nav (views sidebar) */}
            <nav className="border-r bg-white">
              <div className="flex h-full flex-col p-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-neutral-100"
                >
                  <Plus className="h-4 w-4" />
                  Create new…
                </button>

                <div className="mt-2 flex items-center gap-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                      className="h-9 w-full rounded-lg border pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="Find a view"
                    />
                  </div>
                  <IconButton label="View list options">
                    <Settings className="h-4 w-4" />
                  </IconButton>
                </div>

                <div className="mt-3 min-h-0 flex-1 overflow-auto">
                  <div className="rounded-lg bg-neutral-50 p-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md bg-white px-2 py-2 text-sm font-semibold shadow-sm"
                    >
                      <LayoutGrid className="h-4 w-4 text-blue-600" />
                      <span className="truncate">Grid view</span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main content (the actual table goes here) */}
            <main className="min-w-0 min-h-0 bg-neutral-50">
              <div className="h-full min-h-0">
                <TableClient tableId={props.tableId} columnsMeta={props.columnsMeta} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function PillButton(props: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-foreground-subtle hover:bg-neutral-100"
    >
      {props.icon}
      {props.label ? <span className="max-w-[120px] truncate">{props.label}</span> : null}
    </button>
  )
}
