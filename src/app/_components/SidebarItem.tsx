"use client"

import type { ReactNode } from "react"

export function SidebarItem(props: {
  collapsed: boolean
  label: string
  icon: ReactNode
  rightIcon?: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "flex w-full items-center rounded-[6px] px-3 text-left",
        "h-[38.5px] mb-1 text-[15px] leading-[1.5] font-medium",
        props.active ? "bg-[#f2f2f5] text-[#1f1f24]" : "text-[#3a3a42] hover:bg-[#f2f2f5]",
      ].join(" ")}
    >
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center">{props.icon}</span>

      {!props.collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{props.label}</span>
          {props.rightIcon ? <span className="ml-2 shrink-0">{props.rightIcon}</span> : null}
        </>
      )}
    </button>
  )
}
