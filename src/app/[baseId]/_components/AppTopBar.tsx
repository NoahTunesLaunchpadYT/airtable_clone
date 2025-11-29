import React from "react"
import Link from "next/link"

import {
  ChevronDown,
  History,
  Play,
} from "lucide-react"

function TopNavItem(props: { label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={props.href}
      className={[
        "relative flex items-center px-1 font-semibold",
        props.active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900",
      ].join(" ")}
    >
      <span className="py-3">{props.label}</span>
      {props.active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-900" />}
    </Link>
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

type ColumnMeta = {
  id: string
  name: string
  type: string
}

type TableMeta = {
  id: string
  name: string
}

export function AppTopBar(props: {
  baseId: string
  tableId: string
  tables: TableMeta[]
  columnsMeta: ColumnMeta[]
  baseName?: string
  baseColor?: string // <- add this
}) {
  const baseName = props.baseName ?? "Untitled Base"
  const baseColor = props.baseColor ?? "#111827" // fallback

  return (
    <div className="appTopBarContainer v2AppTopBar">
      <header className="h-14 border-b bg-white ">
      <div
        className="grid h-full items-center gap-3 px-3"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
          {/* Left: logo + base name */}
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md border text-white"
              style={{ backgroundColor: baseColor }} // <- base colour background
            >
              <AirtableMarkWhite />
            </div>

            <button
              type="button"
              className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold hover:bg-neutral-100"
              aria-label="Open base menu"
            >
              <span className="truncate">{baseName}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </div>

          {/* Middle nav (centred) */}
          <nav className="justify-self-center">
            <div className="flex h-full items-stretch gap-2 text-body-default font-[500]">
              <TopNavItem active label="Data" href={`/${props.baseId}/${props.tableId}`} />
              <TopNavItem label="Automations" href="#" />
              <TopNavItem label="Interfaces" href="#" />
              <TopNavItem label="Forms" href="#" />
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 justify-self-end">
            <IconButton label="Base history">
              <History className="h-4 w-4" />
            </IconButton>

            <div className="hidden rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 md:block">
              Trial: 9 days left
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
            >
              <Play className="h-4 w-4" />
              Launch
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-800"
              style={{ backgroundColor: baseColor }}
            >
              Share
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}

function AirtableMarkWhite() {
  return (
    <svg
      width="24"
      height="20.4"
      viewBox="0 0 200 170"
      xmlns="http://www.w3.org/2000/svg"
      style={{ shapeRendering: "geometricPrecision" }}
      aria-hidden="true"
      focusable="false"
    >
      <g>
        <path
          fill="hsla(0, 0%, 100%, 0.95)"
          d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
        />
        <path
          fill="hsla(0, 0%, 100%, 0.95)"
          d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
        />
        <path
          fill="hsla(0, 0%, 100%, 0.95)"
          d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
        />
      </g>
    </svg>
  )
}
