"use client"

import type { ReactNode } from "react"

export function SidebarItem(props: {
  collapsed: boolean
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px]",
        props.active ? "bg-[#f2f2f5] text-[#1f1f24]" : "text-[#3a3a42] hover:bg-[#f2f2f5]"
      ].join(" ")}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center">{props.icon}</span>
      {!props.collapsed && <span className="truncate">{props.label}</span>}
    </button>
  )
}
