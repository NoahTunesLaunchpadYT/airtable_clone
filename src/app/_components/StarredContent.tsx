"use client"

import { useMemo } from "react"
import type { BaseLite, WorkspaceLite } from "~/app/_lib/types"
import { BaseGroups } from "~/app/_components/BaseGroups"

type BaseLike = BaseLite & {
  starred?: boolean
  lastOpenedAt?: Date | string | null
  lastModifiedAt?: Date | string | null
}

function coerceDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function openedAtMs(b: BaseLike): number {
  const d = coerceDate(b.lastOpenedAt) ?? coerceDate(b.lastModifiedAt)
  return d ? d.getTime() : 0
}

export function StarredContent(props: {
  bases: BaseLite[]
  workspaces: WorkspaceLite[]
  isLoading: boolean
  isFetching: boolean
  onOpenBase: (baseId: string) => void
  onToggleStar: (baseId: string) => void
  onDelete: (baseId: string) => void
  starPending: boolean
  deletePending: boolean
}) {
  const starredSorted = useMemo(() => {
    return [...props.bases]
      .map(b => b as BaseLike)
      .filter(b => !!b.starred)
      .sort((a, b) => openedAtMs(b) - openedAtMs(a))
  }, [props.bases])

  return (
    <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col px-12 pb-0 pt-8">
      <h1 className="pb-6 text-left text-[22px] font-[675] leading-[1.25] text-foreground-default">Starred</h1>

      <div className="mt-1 mb-6 flex flex-1 flex-col overflow-y-auto px-1">
        <BaseGroups
          mode="flat"
          bases={starredSorted}
          workspaces={props.workspaces}
          isLoading={props.isLoading}
          isFetching={props.isFetching}
          onOpenBase={props.onOpenBase}
          onToggleStar={props.onToggleStar}
          onDelete={props.onDelete}
          starPending={props.starPending}
          deletePending={props.deletePending}
        />
      </div>
    </div>
  )
}
