"use client"

import { useMemo, useState } from "react"
import { api } from "~/trpc/react"

import type { BaseLite, NavKey, Props, WorkspaceLite } from "./_lib/types"
import { toMs } from "./_lib/date"

import { TopBar } from "~/app/_components/TopBar"
import { Sidebar } from "./_components/Sidebar"
import { RecentSection } from "~/app/_components/RecentSection"
import { BasesSection } from "~/app/_components/BasesSection"
import { TablesSection } from "~/app/_components/TablesSection"

export default function AirtableHomeClient({ userName }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState<NavKey>("home")
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null)

  const workspacesQ = api.workspace.list.useQuery()
  const basesQ = api.base.getBases.useQuery()

  const workspaces = useMemo<WorkspaceLite[]>(
    () => (workspacesQ.data ?? []).map(w => ({ id: w.id, name: w.name })),
    [workspacesQ.data]
  )

  const bases = useMemo<BaseLite[]>(
    () =>
      (basesQ.data ?? []).map(b => ({
        id: b.id,
        name: b.name,
        workspaceId: b.workspaceId,
        workspaceName: b.workspaceName,
        starred: b.starred,
        lastModifiedAt: b.lastModifiedAt,
        color: b.color,
        lastOpenedAt: b.lastOpenedAt
      })),
    [basesQ.data]
  )

  const demoM = api.demo.createDemoData.useMutation({
    onSuccess: async () => {
      await Promise.all([workspacesQ.refetch(), basesQ.refetch()])
      setActiveNav("home")
      setSelectedWorkspaceId(null)
      setSelectedBaseId(null)
    }
  })

  const toggleStarM = api.base.toggleStarred.useMutation({
    onSuccess: async () => {
      await basesQ.refetch()
    }
  })

  const tablesQ = api.base.getTablesForBase.useQuery({ baseId: selectedBaseId ?? "" }, { enabled: !!selectedBaseId })

  const basesFiltered = useMemo(() => {
    let list = bases

    if (selectedWorkspaceId) list = list.filter(b => b.workspaceId === selectedWorkspaceId)
    if (activeNav === "starred") list = list.filter(b => b.starred)
    if (activeNav === "recents") list = [...list].sort((a, b) => toMs(b.lastModifiedAt) - toMs(a.lastModifiedAt))

    return list
  }, [bases, selectedWorkspaceId, activeNav])

  const recentBases = useMemo(() => {
    return [...bases].sort((a, b) => toMs(b.lastModifiedAt) - toMs(a.lastModifiedAt)).slice(0, 6)
  }, [bases])

  const selectedWorkspaceName =
    (selectedWorkspaceId && workspaces.find(w => w.id === selectedWorkspaceId)?.name) ?? "All workspaces"

  const basesTitle =
    activeNav === "home" ? "All bases" : activeNav === "starred" ? "Starred bases" : "Recent bases"

  return (
    <div className="h-dvh w-full bg-[#f6f6f8] text-[#1f1f24]">
      <div className="h-0 w-full" />

      <TopBar
        userName={userName}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        onGoHome={() => {
          setActiveNav("home")
          setSelectedBaseId(null)
        }}
        onDemoData={() => demoM.mutate()}
        demoPending={demoM.isPending}
        workspaces={(workspacesQ.data ?? []).map(w => ({ id: w.id, name: w.name }))}
        bases={(basesQ.data ?? []).map(b => ({
          id: b.id,
          name: b.name,
          workspaceId: b.workspaceId,
          workspaceName: b.workspaceName,
          color: b.color,
          lastOpenedAt: b.lastOpenedAt,
        }))}
        onOpenBase={(baseId) => setSelectedBaseId(baseId)} // or router.push(...)
        onOpenWorkspace={(workspaceId) => setSelectedWorkspaceId(workspaceId)}
      />


      <div className="flex h-[calc(100dvh-56px)] w-full">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeNav={activeNav}
          onChangeNav={setActiveNav}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectWorkspace={setSelectedWorkspaceId}
          workspaces={workspaces}
          workspacesLoading={workspacesQ.isLoading}
        />
        <main className="flex-1 overflow-auto bg-[#f9fafb]">
          <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col px-12 pb-0 pt-8">
            <h1 className="pb-6 text-left text-[22px] font-[675] leading-[1.25] text-foreground-default">
              {activeNav === "home" ? "Home" : activeNav === "starred" ? "Starred" : "Recents"}
            </h1>

            {/* Opened dropdown row (visual only for now) */}
            <button
              type="button"
              className="flex h-12 items-center gap-2 p-0 text-[16px] text-foreground-subtle hover:text-foreground-default"
              aria-label="Opened filter"
            >
              <span>Opened anytime</span>
              <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M4.47 6.47a.75.75 0 0 1 1.06 0L8 8.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L8.53 10.53a.75.75 0 0 1-1.06 0L4.47 7.53a.75.75 0 0 1 0-1.06Z"
                />
              </svg>
            </button>

            {/* Remaining vertical space */}
            <div className="mt-1 mb-6 flex flex-1 flex-col overflow-y-auto px-1">
              {/* No separate RecentSection. BasesSection handles the grouped rows when "Opened anytime" is selected. */}
              <BasesSection
                title={activeNav === "home" ? "All bases" : activeNav === "starred" ? "Starred bases" : "Recents"}
                bases={basesFiltered}
                workspaces={workspaces}
                isLoading={basesQ.isLoading}
                isFetching={basesQ.isFetching}
                onOpenBase={setSelectedBaseId}
                onToggleStar={baseId => toggleStarM.mutate({ baseId })}
                starPending={toggleStarM.isPending}
                openedAnytimeGrouping={activeNav === "home"} // renders Today / Past 7 / Past 30 / Past year / Earlier
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
