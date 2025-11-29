"use client"

import type { NavKey, WorkspaceLite } from "~/app/_lib/types"
import { SidebarItem } from "./SidebarItem"
import { IconHome, IconStar } from "~/app/_components/AirtableIcons"

function ChevronDownIcon(props: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={props.className}
    >
      <path
        fill="currentColor"
        d="M4.47 6.47a.75.75 0 0 1 1.06 0L8 8.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L8.53 10.53a.75.75 0 0 1-1.06 0L4.47 7.53a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  )
}

export function Sidebar(props: {
  collapsed: boolean
  activeNav: NavKey
  onChangeNav: (k: NavKey) => void
  selectedWorkspaceId: string | null
  onSelectWorkspace: (id: string | null) => void
  workspaces: WorkspaceLite[]
  workspacesLoading: boolean

  onCreateBase: () => void
  createPending: boolean
}) {
  return (
    <aside
      className={[
        "bg-white border-r-[0.667px] border-[#e3e3e7]",
        "pt-3 px-3 pb-3", // top padding 20, sides 12
        props.collapsed ? "w-[56px]" : "w-[299.333px]", // 275.333 inner + 24 padding
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        {/* top */}
        <div className="flex flex-col">
          <SidebarItem
            collapsed={props.collapsed}
            active={props.activeNav === "home"}
            icon={<IconHome />}
            label="Home"
            onClick={() => props.onChangeNav("home")}
          />

          <SidebarItem
            collapsed={props.collapsed}
            active={props.activeNav === "starred"}
            icon={<IconStar />}
            label="Starred"
            onClick={() => props.onChangeNav("starred")}
          />

          <SidebarItem
            collapsed={props.collapsed}
            active={props.activeNav === "workspaces"}
            icon={<span className="text-[14px] leading-none">W</span>}
            label="Workspaces"
            rightIcon={<ChevronDownIcon className="text-[#6b6b76]" />}
            onClick={() => props.onChangeNav("workspaces")}
          />
        </div>

        {/* bottom */}
        <div className="mt-auto">
          <div className="h-px w-full bg-[#e3e3e7]" />
          <div className="mx-0 mb-2 mt-4 px-0">
            <button
              type="button"
              onClick={props.onCreateBase}
              disabled={props.createPending}
              className="flex h-8 w-full items-center justify-center rounded-[6px] bg-[#1b72e8] px-3 text-[13px] font-semibold text-white hover:bg-[#1663cc] disabled:opacity-60"
            >
              + Create
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
