"use client"

import type { BaseLite, WorkspaceLite } from "~/app/_lib/types"
import { BaseGroups } from "~/app/_components/BaseGroups"

export type OpenedFilter = "anytime" | "today" | "past7" | "past30"

export function HomeContent(props: {
  bases: BaseLite[]
  workspaces: WorkspaceLite[]
  isLoading: boolean
  isFetching: boolean
  openedFilter: OpenedFilter
  onChangeOpenedFilter: (v: OpenedFilter) => void
  onOpenBase: (baseId: string) => void
  onToggleStar: (baseId: string) => void
  starPending: boolean
}) {
  const label =
    props.openedFilter === "anytime"
      ? "Opened anytime"
      : props.openedFilter === "today"
        ? "Opened today"
        : props.openedFilter === "past7"
          ? "Opened in the past 7 days"
          : "Opened in the past 30 days"

  return (
    <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col px-12 pb-0 pt-8">
      <h1 className="pb-6 text-left text-[22px] font-[675] leading-[1.25] text-foreground-default">Home</h1>

      {/* Opened dropdown row */}
      <div className="h-12">
        <select
          value={props.openedFilter}
          onChange={e => props.onChangeOpenedFilter(e.target.value as OpenedFilter)}
          className="h-12 w-full bg-transparent p-0 text-[16px] text-foreground-subtle outline-none hover:text-foreground-subtle"
          aria-label="Opened filter"
        >
          <option value="anytime">Opened anytime</option>
          <option value="today">Opened today</option>
          <option value="past7">Opened in the past 7 days</option>
          <option value="past30">Opened in the past 30 days</option>
        </select>
      </div>

      {/* Remaining vertical space */}
      <div className="mt-1 mb-6 flex flex-1 flex-col overflow-y-auto px-1">
        <BaseGroups
          mode={props.openedFilter === "anytime" ? "openedAnytime" : "flat"}
          headerLabel={props.openedFilter === "anytime" ? undefined : label}
          openedFilter={props.openedFilter}
          bases={props.bases}
          workspaces={props.workspaces}
          isLoading={props.isLoading}
          isFetching={props.isFetching}
          onOpenBase={props.onOpenBase}
          onToggleStar={props.onToggleStar}
          starPending={props.starPending}
        />
      </div>
    </div>
  )
}
