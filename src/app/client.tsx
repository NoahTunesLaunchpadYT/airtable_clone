"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { api } from "~/trpc/react"

type Props = {
  userName: string
}

function formatRelative(d?: Date | string | null) {
  if (!d) return "Unknown"
  const date = typeof d === "string" ? new Date(d) : d
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

type WorkspaceLite = { id: string; name: string }

type BaseLite = {
  id: string
  name: string
  workspaceId: string
  workspaceName: string
  starred: boolean
  lastModifiedAt: Date
}

function toMs(d?: Date | string | null) {
  if (!d) return 0
  return (typeof d === "string" ? new Date(d) : d).getTime()
}

export default function AirtableHomeClient({ userName }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState<"home" | "starred" | "recents">("home")
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null)

  const workspacesQ = api.workspace.list.useQuery()
  const basesQ = api.base.getBases.useQuery()

  // Normalise server results into small, stable arrays for UI + memo deps
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
      })),
    [basesQ.data]
  )

  const demoM = api.demo.createDemoData.useMutation({
    onSuccess: async () => {
      await Promise.all([workspacesQ.refetch(), basesQ.refetch()])
      setActiveNav("home")
      setSelectedWorkspaceId(null)
      setSelectedBaseId(null)
    },
  })

  const toggleStarM = api.base.toggleStarred.useMutation({
    onSuccess: async () => {
      await basesQ.refetch()
    },
  })

  const tablesQ = api.base.getTablesForBase.useQuery(
    { baseId: selectedBaseId ?? "" },
    { enabled: !!selectedBaseId }
  )

  const basesFiltered = useMemo(() => {
    let list = bases

    if (selectedWorkspaceId) {
      list = list.filter(b => b.workspaceId === selectedWorkspaceId)
    }

    if (activeNav === "starred") {
      list = list.filter(b => b.starred)
    }

    if (activeNav === "recents") {
      list = [...list].sort((a, b) => toMs(b.lastModifiedAt) - toMs(a.lastModifiedAt))
    }

    return list
  }, [bases, selectedWorkspaceId, activeNav])

  const recentBases = useMemo(() => {
    return [...bases].sort((a, b) => toMs(b.lastModifiedAt) - toMs(a.lastModifiedAt)).slice(0, 6)
  }, [bases])

  const selectedWorkspaceName =
    (selectedWorkspaceId && workspaces.find(w => w.id === selectedWorkspaceId)?.name) ?? "All workspaces"

  return (
    <div className="h-dvh w-full bg-[#f6f6f8] text-[#1f1f24]">
      <div className="h-0 w-full" />

      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e3e3e7] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f2f2f5] active:bg-[#ececf1]"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(v => !v)}
          >
            <IconList />
          </button>

          <a
            href="#"
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[#f2f2f5]"
            aria-label="Airtable home"
            onClick={e => {
              e.preventDefault()
              setActiveNav("home")
              setSelectedBaseId(null)
            }}
          >
            <AirtableMark />
            <span className="text-[13px] font-semibold tracking-[0.01em]">Airtable</span>
          </a>

          <div className="mx-2 flex min-w-0 flex-1 items-center">
            <div className="flex w-full max-w-[680px] items-center gap-2 rounded-lg border border-[#e3e3e7] bg-[#fbfbfc] px-3 py-1.5 focus-within:border-[#c7c7d1]">
              <IconSearch />
              <input
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#7b7b87]"
                placeholder="Search bases"
              />
              <kbd className="hidden rounded-md border border-[#e3e3e7] bg-white px-1.5 py-0.5 text-[11px] text-[#6b6b76] sm:block">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <TopIconButton label="Generate demo data">
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#f2f2f5] px-2 text-[12px] font-semibold text-[#2b2b31] hover:bg-[#ececf1]"
                onClick={() => demoM.mutate()}
                disabled={demoM.isPending}
              >
                {demoM.isPending ? "Generating..." : "Demo data"}
              </button>
            </TopIconButton>

            <TopIconButton label="Help">
              <IconHelp />
            </TopIconButton>
            <TopIconButton label="Notifications">
              <IconBell />
            </TopIconButton>
            <div className="ml-1 h-8 w-px bg-[#e9e9ee]" />
            <div className="ml-1 flex h-8 items-center gap-2 rounded-md px-2 hover:bg-[#f2f2f5]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b72e8] text-[12px] font-semibold text-white">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-[13px] text-[#3a3a42] sm:block">{userName}</span>
              <Link className="text-[12px] text-[#6b6b76] hover:underline" href="/api/auth/signout">
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100dvh-3rem)] w-full">
        {/* Sidebar */}
        <aside
          className={[
            "border-r border-[#e3e3e7] bg-white",
            sidebarCollapsed ? "w-[56px]" : "w-[280px]"
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="px-2 py-2">
              <SidebarItem
                collapsed={sidebarCollapsed}
                active={activeNav === "home"}
                icon={<IconHome />}
                label="Home"
                onClick={() => setActiveNav("home")}
              />
              <SidebarItem
                collapsed={sidebarCollapsed}
                active={activeNav === "starred"}
                icon={<IconStar />}
                label="Starred"
                onClick={() => setActiveNav("starred")}
              />
              <SidebarItem
                collapsed={sidebarCollapsed}
                active={activeNav === "recents"}
                icon={<IconClock />}
                label="Recents"
                onClick={() => setActiveNav("recents")}
              />
            </div>

            <div className="px-2">
              <div className="my-2 h-px bg-[#ededf2]" />
            </div>

            <div className="flex items-center justify-between px-3 py-2">
              {!sidebarCollapsed && (
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b76]">
                  Workspaces
                </div>
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
                collapsed={sidebarCollapsed}
                name="All workspaces"
                active={!selectedWorkspaceId}
                onClick={() => setSelectedWorkspaceId(null)}
              />

              {workspacesQ.isLoading && !sidebarCollapsed && (
                <div className="px-2 py-2 text-[12px] text-[#6b6b76]">Loading workspaces...</div>
              )}

              {workspaces.map(w => (
                <WorkspaceRow
                  key={w.id}
                  collapsed={sidebarCollapsed}
                  name={w.name}
                  active={selectedWorkspaceId === w.id}
                  onClick={() => setSelectedWorkspaceId(w.id)}
                />
              ))}
            </div>

            <div className="border-t border-[#e3e3e7] p-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#3a3a42] hover:bg-[#f2f2f5]"
              >
                <IconSettings />
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
            <div className="mb-5">
              <h1 className="text-[22px] font-semibold leading-tight">
                {activeNav === "home" ? "Home" : activeNav === "starred" ? "Starred" : "Recents"}
              </h1>
              <p className="mt-1 text-[13px] text-[#6b6b76]">
                {selectedWorkspaceName}
                {selectedBaseId ? " • Base selected" : ""}
              </p>
            </div>

            {/* Recent section (only on Home) */}
            {activeNav === "home" && (
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#2b2b31]">Recently opened</h2>
                  <button
                    className="text-[13px] text-[#1b72e8] hover:underline"
                    type="button"
                    onClick={() => setActiveNav("recents")}
                  >
                    View all
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentBases.map(b => (
                    <BaseCard
                      key={b.id}
                      base={b}
                      workspaceName={workspaces.find(w => w.id === b.workspaceId)?.name ?? "Workspace"}
                      onOpen={() => setSelectedBaseId(b.id)}
                      onToggleStar={() => toggleStarM.mutate({ baseId: b.id })}
                      starPending={toggleStarM.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Bases list (filtered by nav + workspace) */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#2b2b31]">
                  {activeNav === "home" ? "All bases" : activeNav === "starred" ? "Starred bases" : "Recent bases"}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#6b6b76]">
                    {basesQ.isFetching ? "Updating..." : `${basesFiltered.length} bases`}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {basesQ.isLoading && (
                  <div className="text-[13px] text-[#6b6b76]">Loading bases...</div>
                )}

                {!basesQ.isLoading && basesFiltered.length === 0 && (
                  <div className="rounded-xl border border-[#e3e3e7] bg-white p-4 text-[13px] text-[#6b6b76]">
                    No bases here yet. Try “Demo data” in the top bar.
                  </div>
                )}

                {basesFiltered.map(b => (
                  <BaseCard
                    key={b.id}
                    base={b}
                    workspaceName={workspaces.find(w => w.id === b.workspaceId)?.name ?? "Workspace"}
                    onOpen={() => setSelectedBaseId(b.id)}
                    onToggleStar={() => toggleStarM.mutate({ baseId: b.id })}
                    starPending={toggleStarM.isPending}
                  />
                ))}
              </div>
            </section>

            {/* Tables for selected base */}
            {!!selectedBaseId && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#2b2b31]">Tables</h2>
                  <button
                    type="button"
                    className="text-[13px] text-[#1b72e8] hover:underline"
                    onClick={() => setSelectedBaseId(null)}
                  >
                    Clear selection
                  </button>
                </div>

                <div className="rounded-xl border border-[#e3e3e7] bg-white p-4">
                  {tablesQ.isLoading && <div className="text-[13px] text-[#6b6b76]">Loading tables...</div>}
                  {!tablesQ.isLoading && (
                    <div className="space-y-2">
                      {(tablesQ.data ?? []).map(t => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[#f2f2f5]"
                        >
                          <div className="text-[13px] font-medium text-[#2b2b31]">{t.name}</div>
                            <Link
                              href={`/${selectedBaseId}/${t.id}`}
                              className="text-[12px] text-[#1b72e8] hover:underline"
                            >
                            Open
                          </Link>
                        </div>
                      ))}

                      {(tablesQ.data?.length ?? 0) === 0 && (
                        <div className="text-[13px] text-[#6b6b76]">No tables yet in this base.</div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------- Components ---------- */

function BaseCard(props: {
  base: { id: string; name: string; starred?: boolean; lastModified?: Date | string | null }
  workspaceName: string
  onOpen: () => void
  onToggleStar: () => void
  starPending: boolean
}) {
  const b = props.base
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") props.onOpen();
      }}
      className="group relative cursor-pointer rounded-xl border border-[#e3e3e7] bg-white p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] hover:border-[#d6d6df] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[#1b72e8]/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold">{b.name}</div>
          <div className="mt-1 text-[12px] text-[#6b6b76]">{props.workspaceName}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#f2f2f5] px-2 py-1 text-[11px] text-[#5f5f6b]">Base</span>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f2f2f5]"
            onClick={(e) => {
              e.stopPropagation();
              props.onToggleStar();
            }}
            aria-label={b.starred ? "Unstar base" : "Star base"}
            title={b.starred ? "Unstar" : "Star"}
            disabled={props.starPending}
          >
            <IconStarFilled active={!!b.starred} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[12px] text-[#6b6b76]">
        <span>Updated</span>
        <span className="text-[#4b4b55]">{formatRelative(b.lastModified)}</span>
      </div>
    </div>
  );

}

function TopIconButton(props: { label: string; children: React.ReactNode }) {
  return (
    <div aria-label={props.label} title={props.label} className="inline-flex items-center justify-center">
      {props.children}
    </div>
  )
}

function SidebarItem(props: {
  collapsed: boolean
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px]",
        props.active ? "bg-[#f2f2f5] text-[#1f1f24]" : "text-[#3a3a42] hover:bg-[#f2f2f5]"
      ].join(" ")}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center">{props.icon}</span>
      {!props.collapsed && <span className="truncate">{props.label}</span>}
    </button>
  )
}

function WorkspaceRow(props: { collapsed: boolean; name: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px]",
        props.active ? "bg-[#f2f2f5] text-[#1f1f24]" : "text-[#3a3a42] hover:bg-[#f2f2f5]"
      ].join(" ")}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f2f2f5]">
        <IconGrid />
      </span>
      {!props.collapsed && <span className="truncate">{props.name}</span>}
    </button>
  )
}

/* ---------- Minimal inline icons ---------- */

function AirtableMark() {
  return (
    <div aria-label="Airtable" className="inline-block">
      <svg
        width="30"
        height="26"
        viewBox="0 0 200 170"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            fill="#FFBA05"
            d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
          />
          <path
            fill="#39CAFF"
            d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
          />
          <path
            fill="#DC043B"
            d="M88.0781,91.8464 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C13.5731,56.2884 15.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
          />
          <path
            fill="rgba(0,0,0,0.25)"
            d="M88.0781,91.8464 L66.1741,102.4224 L12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
          />
        </g>
      </svg>
    </div>
  )
}




function IconStarFilled({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.8 12 7l4.6.7-3.3 3.2.8 4.6L10 13.6 5.9 15.5l.8-4.6L3.4 7.7 8 7l2-4.2Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity={active ? 0.95 : 0.7}
      />
    </svg>
  )
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M9 15a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.8 13.8 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Z" fill="currentColor" opacity="0.9" />
      <path
        d="M15 14H5c1-1.2 1.5-2.6 1.5-4.5V8a3.5 3.5 0 0 1 7 0v1.5c0 1.9.5 3.3 1.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconHelp() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8.7 7.7a1.6 1.6 0 1 1 2.7 1.2c-.7.6-1.2.9-1.2 1.8v.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M10 14.2h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M8 17V12h4v5m-8-7 6-6 6 6v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.8 12 7l4.6.7-3.3 3.2.8 4.6L10 13.6 5.9 15.5l.8-4.6L3.4 7.7 8 7l2-4.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 5.5v5l3.2 1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 4h5v5H4V4Zm7 0h5v5h-5V4ZM4 11h5v5H4v-5Zm7 0h5v5h-5v-5Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M16.8 10a6.9 6.9 0 0 0-.1-1l1.4-1.1-1.5-2.6-1.7.7a7 7 0 0 0-1.7-1l-.3-1.8H7.1l-.3 1.8a7 7 0 0 0-1.7 1l-1.7-.7L1.9 7.9 3.3 9a6.9 6.9 0 0 0 0 2l-1.4 1.1 1.5 2.6 1.7-.7c.5.4 1.1.7 1.7 1l.3 1.8h5.8l.3-1.8c.6-.3 1.2-.6 1.7-1l1.7.7 1.5-2.6L16.7 11c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
