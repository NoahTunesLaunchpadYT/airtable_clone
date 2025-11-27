"use client"

import { IconGrid } from "~/app/_components/AirtableIcons"

export function WorkspaceRow(props: { collapsed: boolean; name: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px]",
        props.active ? "bg-[#f2f2f5] text-[#1f1f24]" : "text-[#3a3a42] hover:bg-[#f2f2f5]"
      ].join(" ")}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f2f2f5]">
        <IconGrid />
      </span>
      {!props.collapsed && <span className="truncate">{props.name}</span>}
    </button>
  )
}
