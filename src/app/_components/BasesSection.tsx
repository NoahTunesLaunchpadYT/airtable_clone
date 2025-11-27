"use client"

import type { BaseLite, WorkspaceLite } from "~/app/_lib/types"
import { BaseCard } from "./BaseCard"

type BucketKey = "today" | "past7" | "past30" | "pastYear" | "older"

const BUCKET_LABEL: Record<BucketKey, string> = {
  today: "Today",
  past7: "Past 7 days",
  past30: "Past 30 days",
  pastYear: "Past year",
  older: "Earlier", // > 1 year
}

function toDate(v: unknown): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

function pickOpenedAt(b: any): Date | null {
  // prefer lastOpenedAt, fall back to lastModifiedAt
  return toDate(b.lastOpenedAt) ?? toDate(b.lastModifiedAt)
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

export function BasesSection(props: {
  title: string
  bases: BaseLite[]
  workspaces: WorkspaceLite[]
  isLoading: boolean
  isFetching: boolean
  onOpenBase: (baseId: string) => void
  onToggleStar: (baseId: string) => void
  starPending: boolean

  // When true, render the Airtable-style "Opened anytime" buckets
  openedAnytimeGrouping?: boolean
}) {
  const grouped = !!props.openedAnytimeGrouping

  const basesWithWorkspace = props.bases.map(b => ({
    base: b as any,
    workspaceName: props.workspaces.find(w => w.id === (b as any).workspaceId)?.name ?? "Workspace",
    openedAt: pickOpenedAt(b as any),
  }))

  const buckets: Record<BucketKey, typeof basesWithWorkspace> = {
    today: [],
    past7: [],
    past30: [],
    pastYear: [],
    older: [],
  }

  for (const item of basesWithWorkspace) {
    buckets[bucketForOpenedAt(item.openedAt)].push(item)
  }

  ;(Object.keys(buckets) as BucketKey[]).forEach(k => {
    buckets[k].sort((a, b) => {
      const am = a.openedAt?.getTime() ?? 0
      const bm = b.openedAt?.getTime() ?? 0
      return bm - am
    })
  })

  const orderedKeys: BucketKey[] = ["today", "past7", "past30", "pastYear", "older"]

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        {/* <h2 className="text-[14px] font-semibold text-foreground-default">{props.title}</h2> */}
        {/* <span className="text-[12px] text-foreground-subtle">
          {props.isFetching ? "Updating..." : `${props.bases.length} bases`}
        </span> */}
      </div>

      {props.isLoading && <div className="text-[13px] text-foreground-subtle">Loading bases...</div>}

      {!props.isLoading && props.bases.length === 0 && (
        <div className="w-full rounded-[6px] bg-white p-4 text-[13px] text-foreground-subtle shadow-elevation-low">
          No bases here yet. Try “Demo data” in the top bar.
        </div>
      )}

      {!props.isLoading && props.bases.length > 0 && (
        <div className="flex w-full flex-col">
          {grouped ? (
            orderedKeys.map(key => {
              const list = buckets[key]
              if (list.length === 0) return null

              return (
                <div key={key} className="w-full">
                  <h4 className="mb-2 text-[12px] font-semibold text-foreground-subtle">{BUCKET_LABEL[key]}</h4>

                  {/* Full-width row group that always starts on a new line */}
                  <div className="mb-6 flex w-full flex-wrap content-start gap-4">
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
            })
          ) : (
            <div className="flex w-full flex-wrap content-start gap-4">
              {basesWithWorkspace.map(({ base, workspaceName }) => (
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
          )}
        </div>
      )}
    </section>
  )
}
