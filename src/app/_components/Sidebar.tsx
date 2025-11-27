"use client"

import type { NavKey, WorkspaceLite } from "~/app/_lib/types"
import { SidebarItem } from "./SidebarItem"
import { WorkspaceRow } from "./WorkspaceRow"
import { IconHome, IconPlus, IconSettings, IconStar } from "~/app/_components/AirtableIcons"

export function Sidebar(props: {
  collapsed: boolean
  activeNav: NavKey
  onChangeNav: (k: NavKey) => void
  selectedWorkspaceId: string | null
  onSelectWorkspace: (id: string | null) => void
  workspaces: WorkspaceLite[]
  workspacesLoading: boolean
}) {
  return (
    <aside
      className={[
        "border-r border-[#e3e3e7] bg-white",
        props.collapsed ? "w-[56px]" : "w-[280px]"
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        <div className="px-2 py-2">
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
        </div>

        <div className="px-2">
          <div className="my-2 h-px bg-[#ededf2]" />
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          {!props.collapsed && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b76]">Workspaces</div>
          )}
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#f2f2f5]"
            aria-label="Create workspace"
            title="Create workspace"
          >
            <IconPlus />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-2 pb-3">
          <WorkspaceRow
            collapsed={props.collapsed}
            name="All workspaces"
            active={!props.selectedWorkspaceId}
            onClick={() => props.onSelectWorkspace(null)}
          />

          {props.workspacesLoading && !props.collapsed && (
            <div className="px-2 py-2 text-[12px] text-[#6b6b76]">Loading workspaces...</div>
          )}

          {props.workspaces.map(w => (
            <WorkspaceRow
              key={w.id}
              collapsed={props.collapsed}
              name={w.name}
              active={props.selectedWorkspaceId === w.id}
              onClick={() => props.onSelectWorkspace(w.id)}
            />
          ))}
        </div>

        <div className="border-t border-[#e3e3e7] p-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#3a3a42] hover:bg-[#f2f2f5]"
          >
            <IconSettings />
            {!props.collapsed && <span>Settings</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
