"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "~/trpc/react"

import type { BaseLite, NavKey, Props, WorkspaceLite } from "./_lib/types"

import { TopBar } from "~/app/_components/TopBar"
import { Sidebar } from "./_components/Sidebar"
import { BaseGroups, type OpenedFilter } from "~/app/_components/BaseGroups"

type OpenedFilterOption = OpenedFilter

const OPENED_LABEL: Record<OpenedFilterOption, string> = {
  anytime: "Opened anytime",
  today: "Opened today",
  past7: "Opened in the past 7 days",
  past30: "Opened in the past 30 days",
  pastYear: "Opened in the past year",
}

export default function AirtableHomeClient({ userName }: Props) {
  const router = useRouter()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState<NavKey>("home")
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)

  // Home-only UI state
  const [openedFilter, setOpenedFilter] = useState<OpenedFilterOption>("anytime")

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
        lastOpenedAt: b.lastOpenedAt,
      })),
    [basesQ.data]
  )

  const demoM = api.demo.createDemoData.useMutation({
    onSuccess: async () => {
      await Promise.all([workspacesQ.refetch(), basesQ.refetch()])
      setActiveNav("home")
      setSelectedWorkspaceId(null)
      setOpenedFilter("anytime")
    },
  })

  const toggleStarM = api.base.toggleStarred.useMutation({
    onSuccess: async () => {
      await basesQ.refetch()
    },
  })

  const markOpenedM = api.base.markOpened.useMutation({
    onSuccess: async () => {
      await basesQ.refetch()
    },
  })

  const onOpenBase = (baseId: string) => {
    markOpenedM.mutate({ baseId }) // fire-and-forget
    router.push(`/${baseId}`)
  }

  const basesFiltered = useMemo(() => {
    let list = bases

    if (selectedWorkspaceId) list = list.filter(b => b.workspaceId === selectedWorkspaceId)

    if (activeNav === "starred") {
      // Starred: no grouping, just recency sort (BaseGroups will do openedAt-desc for flat)
      list = list.filter(b => b.starred)
    }

    return list
  }, [bases, selectedWorkspaceId, activeNav])

  const openedLabel = OPENED_LABEL[openedFilter]

  return (
    <div className="h-dvh w-full bg-[#f6f6f8] text-[#1f1f24]">
      <div className="h-0 w-full" />

      <TopBar
        userName={userName}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        onGoHome={() => {
          setActiveNav("home")
          setSelectedWorkspaceId(null)
          setOpenedFilter("anytime")
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
        onOpenBase={onOpenBase}
        onOpenWorkspace={workspaceId => setSelectedWorkspaceId(workspaceId)}
      />

      <div className="flex h-[calc(100dvh-56px)] w-full">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeNav={activeNav}
          onChangeNav={nav => {
            setActiveNav(nav)
            if (nav !== "home") setOpenedFilter("anytime")
          }}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectWorkspace={setSelectedWorkspaceId}
          workspaces={workspaces}
          workspacesLoading={workspacesQ.isLoading}
        />

        <main className="flex-1 overflow-auto bg-[#f9fafb]">
          <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col px-12 pb-0 pt-8">
            <h1 className="pb-6 text-left text-[22px] font-[675] leading-[1.25] text-foreground-default">
              {activeNav === "home" ? "Home" : "Starred"}
            </h1>

            {/* Home-only: Opened filter dropdown (simple, functional UI) */}
            {activeNav === "home" && (
              <div className="h-12">
                <label className="sr-only" htmlFor="opened-filter">
                  Opened filter
                </label>
                <select
                  id="opened-filter"
                  value={openedFilter}
                  onChange={e => setOpenedFilter(e.target.value as OpenedFilterOption)}
                  className="h-12 w-auto bg-transparent p-0 text-[16px] text-foreground-subtle outline-none"
                >
                  <option value="anytime">Opened anytime</option>
                  <option value="today">Opened today</option>
                  <option value="past7">Opened in the past 7 days</option>
                  <option value="past30">Opened in the past 30 days</option>
                </select>
              </div>
            )}

            <div className="mt-1 mb-6 flex flex-1 flex-col overflow-y-auto px-1">
              <BaseGroups
                mode={activeNav === "home" && openedFilter === "anytime" ? "openedAnytime" : "flat"}
                headerLabel={activeNav === "home" && openedFilter !== "anytime" ? openedLabel : undefined}
                openedFilter={activeNav === "home" ? openedFilter : undefined}
                bases={basesFiltered}
                workspaces={workspaces}
                isLoading={basesQ.isLoading}
                isFetching={basesQ.isFetching}
                onOpenBase={onOpenBase}
                onToggleStar={baseId => toggleStarM.mutate({ baseId })}
                starPending={toggleStarM.isPending}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
