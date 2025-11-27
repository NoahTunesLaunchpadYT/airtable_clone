"use client"

import type { BaseLite, WorkspaceLite } from "~/app/_lib/types"
import { BaseCard } from "~/app/_components/BaseCard"

export type OpenedFilter = "anytime" | "today" | "past7" | "past30" | "pastYear"

type BucketKey = "today" | "past7" | "past30" | "pastYear" | "older"

const BUCKET_LABEL: Record<BucketKey, string> = {
  today: "Today",
  past7: "Past 7 days",
  past30: "Past 30 days",
  pastYear: "Past year",
  older: "Earlier",
}

type BaseLike = BaseLite & {
  workspaceId?: string
  workspaceName?: string
  lastOpenedAt?: Date | string | null
  lastModifiedAt?: Date | string | null
  starred?: boolean
  color?: string | null
}

function coerceDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function pickOpenedAt(b: BaseLike): Date | null {
  return coerceDate(b.lastOpenedAt) ?? coerceDate(b.lastModifiedAt)
}

function bucketForOpenedAt(d: Date | null): BucketKey {
  if (!d) return "older"
  const diffMs = Date.now() - d.getTime()
  const diffDays = Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return "today"
  if (diffDays < 7) return "past7"
  if (diffDays < 30) return "past30"
  if (diffDays < 365) return "pastYear"
  return "older"
}

function visibleKeysForFilter(filter: OpenedFilter | undefined): BucketKey[] {
  switch (filter) {
    case "today":
      return ["today"]
    case "past7":
      return ["today", "past7"]
    case "past30":
      return ["today", "past7", "past30"]
    case "pastYear":
      return ["today", "past7", "past30", "pastYear"]
    case "anytime":
    default:
      return ["today", "past7", "past30", "pastYear", "older"]
  }
}

export function BaseGroups(props: {
  mode: "openedAnytime" | "flat"
  headerLabel?: string
  openedFilter?: OpenedFilter
  bases: BaseLite[]
  workspaces: WorkspaceLite[]
  isLoading: boolean
  isFetching: boolean
  onOpenBase: (baseId: string) => void
  onToggleStar: (baseId: string) => void
  starPending: boolean
}) {
  const workspaceNameById = new Map(props.workspaces.map(w => [w.id, w.name]))

  const items = props.bases.map(b => {
    const base = b as BaseLike
    const wsName = (base.workspaceId && workspaceNameById.get(base.workspaceId)) ?? base.workspaceName ?? "Workspace"
    const openedAt = pickOpenedAt(base)

    return {
      base,
      workspaceName: wsName,
      openedAt,
      bucket: bucketForOpenedAt(openedAt),
    }
  })

  const openedFilter = props.openedFilter ?? "anytime"

  // Accumulating filter for Home
  const filteredItems =
    props.mode === "openedAnytime" && openedFilter !== "anytime"
      ? items.filter(it => visibleKeysForFilter(openedFilter).includes(it.bucket))
      : items

  const sortByOpenedDesc = (a: (typeof filteredItems)[number], b: (typeof filteredItems)[number]) =>
    (b.openedAt?.getTime() ?? 0) - (a.openedAt?.getTime() ?? 0)

  if (props.mode === "flat") {
    const flat = [...filteredItems].sort(sortByOpenedDesc)
    return (
      <section className="w-full">
        {props.isLoading && <div className="text-[13px] text-foreground-subtle">Loading bases...</div>}

        {!props.isLoading && props.bases.length === 0 && (
          <div className="w-full rounded-[6px] bg-white p-4 text-[13px] text-foreground-subtle shadow-elevation-low">
            No bases here yet. Try “Demo data” in the top bar.
          </div>
        )}

        {!props.isLoading && flat.length > 0 && (
          <div className="flex w-full flex-col">
            {props.headerLabel && (
              <h4 className="mb-2 text-[12px] font-semibold text-foreground-subtle">{props.headerLabel}</h4>
            )}

            <div className="grid w-full justify-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(286px,572px))]">
              {flat.map(({ base, workspaceName }) => (
                <BaseCard
                  key={base.id}
                  base={base}
                  workspaceName={workspaceName}
                  onOpen={() => props.onOpenBase(base.id)}
                  onToggleStar={() => props.onToggleStar(base.id)}
                  starPending={props.starPending}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    )
  }

  // openedAnytime grouped buckets
  const buckets: Record<BucketKey, typeof filteredItems> = {
    today: [],
    past7: [],
    past30: [],
    pastYear: [],
    older: [],
  }

  for (const it of filteredItems) buckets[it.bucket].push(it)
  ;(Object.keys(buckets) as BucketKey[]).forEach(k => buckets[k].sort(sortByOpenedDesc))

  const visibleKeys = visibleKeysForFilter(openedFilter)

  return (
    <section className="w-full">
      {props.isLoading && <div className="text-[13px] text-foreground-subtle">Loading bases...</div>}

      {!props.isLoading && props.bases.length === 0 && (
        <div className="w-full rounded-[6px] bg-white p-4 text-[13px] text-foreground-subtle shadow-elevation-low">
          No bases here yet. Try “Demo data” in the top bar.
        </div>
      )}

      {!props.isLoading && props.bases.length > 0 && (
        <div className="flex w-full flex-col">
          {visibleKeys.map(key => {
            const list = buckets[key]
            if (list.length === 0) return null

            return (
              <div key={key} className="w-full">
                <h4 className="mb-2 text-[12px] font-semibold text-foreground-subtle">{BUCKET_LABEL[key]}</h4>

                <div className="mb-6 grid w-full justify-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(286px,572px))]">
                  {list.map(({ base, workspaceName }) => (
                    <BaseCard
                      key={base.id}
                      base={base}
                      workspaceName={workspaceName}
                      onOpen={() => props.onOpenBase(base.id)}
                      onToggleStar={() => props.onToggleStar(base.id)}
                      starPending={props.starPending}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
