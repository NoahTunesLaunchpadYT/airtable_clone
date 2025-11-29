// src/app/_components/BaseCard.tsx
"use client"

import { IconStarFilled } from "~/app/_components/AirtableIcons"
import { formatRelative } from "~/app/_lib/date"

function baseInitials(name: string) {
  const s = name.trim()
  const a = (s[0] ?? "").toUpperCase()
  const b = (s[1] ?? "").toLowerCase()
  return `${a}${b}`.trim()
}

function IconTrash(props: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={props.className}
      aria-hidden="true"
      focusable="false"
      style={{ shapeRendering: "geometricPrecision" }}
    >
      <path
        fill="currentColor"
        d="M6 2.75c0-.414.336-.75.75-.75h2.5c.414 0 .75.336.75.75V3.5H6v-.75ZM4.5 3.5V2.75C4.5 1.784 5.284 1 6.25 1h3.5c.966 0 1.75.784 1.75 1.75V3.5H14a.75.75 0 0 1 0 1.5h-.72l-.56 8.02A2 2 0 0 1 10.73 15H5.27a2 2 0 0 1-1.99-1.98L2.72 5H2a.75.75 0 0 1 0-1.5h2.5Zm3.5 0h0Zm3.78 1.5H4.22l.56 7.94c.02.33.29.56.49.56h5.46c.2 0 .47-.23.49-.56l.56-7.94ZM6.25 6.5c.414 0 .75.336.75.75v4a.75.75 0 0 1-1.5 0v-4c0-.414.336-.75.75-.75Zm3.5 0c.414 0 .75.336.75.75v4a.75.75 0 0 1-1.5 0v-4c0-.414.336-.75.75-.75Z"
      />
    </svg>
  )
}

export function BaseCard(props: {
  base: {
    id: string
    name: string
    starred?: boolean
    lastModifiedAt?: Date | string | null
    lastOpenedAt?: Date | string | null
    color?: string | null
  }
  workspaceName: string
  onOpen: () => void
  onToggleStar: () => void
  onDelete: () => void
  starPending: boolean
  deletePending: boolean
}) {
  const b = props.base
  const openedAt = b.lastOpenedAt ?? b.lastModifiedAt

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => props.onOpen()}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") props.onOpen()
      }}
      className="group relative flex h-[92px] w-full cursor-pointer items-stretch overflow-hidden rounded-[6px] bg-white shadow-elevation-low hover:shadow-elevation-medium-hover focus:outline-none"
    >
      {/* Left 92x92 block */}
      <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[12px] shadow-elevation-low"
          style={{ backgroundColor: b.color ?? "#7c3aed" }}
          aria-hidden="true"
        >
          <span className="text-[18px] font-semibold leading-none text-white">{baseInitials(b.name)}</span>
        </div>
      </div>

      {/* Text block */}
      <div className="flex min-w-0 flex-1 flex-col justify-center pr-4 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 truncate text-[14px] font-semibold leading-5 text-foreground-default">{b.name}</div>

          {/* actions */}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f2f2f5]"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                props.onToggleStar()
              }}
              onPointerDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              aria-label={b.starred ? "Unstar base" : "Star base"}
              title={b.starred ? "Unstar" : "Star"}
              disabled={props.starPending}
            >
              <IconStarFilled active={!!b.starred} />
            </button>

            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f2f2f5]"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                props.onDelete()
              }}
              onPointerDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              aria-label="Delete base"
              title="Delete"
              disabled={props.deletePending}
            >
              <IconTrash className="h-4 w-4 text-foreground-subtle" />
            </button>
          </div>
        </div>

        <div className="mt-1 flex min-w-0 items-center justify-between gap-3 text-[13px] leading-4 text-foreground-subtle">
          <span className="min-w-0 truncate">{props.workspaceName}</span>
          <span className="shrink-0">Opened {formatRelative(openedAt)}</span>
        </div>
      </div>
    </div>
  )
}
