"use client"

import { IconStarFilled } from "~/app/_components/AirtableIcons"
import { formatRelative } from "~/app/_lib/date"

function baseInitials(name: string) {
  const s = name.trim()
  const a = (s[0] ?? "").toUpperCase()
  const b = (s[1] ?? "").toLowerCase()
  return `${a}${b}`.trim()
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
  starPending: boolean
}) {
  const b = props.base
  const openedAt = b.lastOpenedAt ?? b.lastModifiedAt

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onOpen}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") props.onOpen()
      }}
      className="group relative flex h-[92px] min-w-[286px] max-w-[572px] flex-1 cursor-pointer items-stretch overflow-hidden rounded-[6px] bg-white shadow-elevation-low hover:shadow-elevation-medium-hover focus:outline-none"
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
          <div className="min-w-0 truncate text-[14px] font-semibold leading-5 text-foreground-default">
            {b.name}
          </div>

          <button
            type="button"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f2f2f5]"
            onClick={e => {
              e.stopPropagation()
              props.onToggleStar()
            }}
            aria-label={b.starred ? "Unstar base" : "Star base"}
            title={b.starred ? "Unstar" : "Star"}
            disabled={props.starPending}
          >
            <IconStarFilled active={!!b.starred} />
          </button>
        </div>

        <div className="mt-1 flex min-w-0 items-center justify-between gap-3 text-[13px] leading-4 text-foreground-subtle">
          <span className="min-w-0 truncate">{props.workspaceName}</span>
          <span className="shrink-0">Opened {formatRelative(openedAt)}</span>
        </div>
      </div>
    </div>
  )
}
