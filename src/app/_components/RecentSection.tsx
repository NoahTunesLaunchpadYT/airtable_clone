"use client"

import type { BaseLite, WorkspaceLite } from "~/app/_lib/types"
import { BaseCard } from "./BaseCard"

export function RecentSection(props: {
  recentBases: BaseLite[]
  workspaces: WorkspaceLite[]
  onViewAll: () => void
  onOpenBase: (baseId: string) => void
  onToggleStar: (baseId: string) => void
  onDelete: (baseId: string) => void
  starPending: boolean
  deletePending: boolean
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#2b2b31]">Recently opened</h2>
        <button className="text-[13px] text-[#1b72e8] hover:underline" type="button" onClick={props.onViewAll}>
          View all
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.recentBases.map(b => (
          <BaseCard
            key={b.id}
            base={{ ...b, lastModifiedAt: b.lastModifiedAt }}
            workspaceName={props.workspaces.find(w => w.id === b.workspaceId)?.name ?? "Workspace"}
            onOpen={() => props.onOpenBase(b.id)}
            onToggleStar={() => props.onToggleStar(b.id)}
            onDelete={() => props.onDelete(b.id)}
            starPending={props.starPending}
            deletePending={props.deletePending}
          />
        ))}
      </div>
    </section>
  )
}
