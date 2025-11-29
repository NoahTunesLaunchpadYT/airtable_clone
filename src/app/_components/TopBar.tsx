"use client"

import Link from "next/link"
import { AirtableBrandLogo, IconBell, IconHelp, IconList, IconSearch } from "~/app/_components/AirtableIcons"

import { useEffect, useMemo, useRef, useState } from "react"

// add helpers near the top of TopBar.tsx
function formatLastOpened(d?: Date | string | null) {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))

  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`

  if (diffSec < 60) return `Last opened ${plural(diffSec, "second")}`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Last opened ${plural(diffMin, "minute")}`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Last opened ${plural(diffHr, "hour")}`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `Last opened ${plural(diffDay, "day")}`

  const diffWeek = Math.floor(diffDay / 7)
  if (diffDay < 30) return `Last opened ${plural(diffWeek, "week")}`

  const diffMonth = Math.floor(diffDay / 30)
  if (diffDay < 365) return `Last opened ${plural(diffMonth, "month")}`

  const diffYear = Math.floor(diffDay / 365)
  return `Last opened ${plural(diffYear, "year")}`
}

function baseInitials(name: string) {
  const s = name.trim()
  const a = (s[0] ?? "").toUpperCase()
  const b = (s[1] ?? "").toLowerCase()
  return `${a}${b}`.trim()
}

export function TopBar(props: {
  userName: string
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onGoHome: () => void
  onDemoData: () => void
  demoPending: boolean

  workspaces: Array<{ id: string; name: string }>
  bases: Array<{
    id: string
    name: string
    workspaceId: string
    workspaceName: string
    lastOpenedAt?: Date | string | null
    color?: string | null
  }>
  onOpenBase: (baseId: string) => void
  onOpenWorkspace?: (workspaceId: string) => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"all" | "workspaces" | "bases">("all")
  const inputRef = useRef<HTMLInputElement | null>(null)

  // replace your results useMemo with this version (recently opened when query is empty)
  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const match = (s: string) => (q.length ? s.toLowerCase().includes(q) : true)

    const basesSrc = props.bases ?? []
    const workspacesSrc = props.workspaces ?? []

    const bases = basesSrc
      .filter(b => (q.length ? match(b.name) : true))
      .map(b => ({
        kind: "base" as const,
        id: b.id,
        name: b.name,
        workspaceName: b.workspaceName,
        lastOpenedAt: b.lastOpenedAt ?? null,
        color: b.color ?? null,
      }))

    const workspaces = workspacesSrc
      .filter(w => match(w.name))
      .map(w => ({
        kind: "workspace" as const,
        id: w.id,
        name: w.name,
        lastOpenedAt: null as Date | string | null,
      }))

    if (q.length === 0) {
      return [...bases].sort((a, b) => {
        const am = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0
        const bm = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0
        return bm - am
      })
    }

    const filteredBases =
      searchType === "workspaces" ? [] : bases.filter(b => match(b.name))
    const filteredWorkspaces =
      searchType === "bases" ? [] : workspaces.filter(w => match(w.name))

    return [...filteredBases, ...filteredWorkspaces].slice(0, 50)
  }, [props.bases, props.workspaces, searchQuery, searchType])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery("")
    setSearchType("all")
  }

  useEffect(() => {
    if (!searchOpen) return
    inputRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch()
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [searchOpen])

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k"
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onGlobalKeyDown)
    return () => window.removeEventListener("keydown", onGlobalKeyDown)
  }, [])

  const [profileOpen, setProfileOpen] = useState(false)
  const profileBtnRef = useRef<HTMLButtonElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
    if (!profileOpen) return

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (profileBtnRef.current?.contains(t)) return
      if (profileMenuRef.current?.contains(t)) return
      setProfileOpen(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false)
    }

    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [profileOpen])


  return (
    <>
      <header className="sticky top-0 z-50 box-border h-[56px] w-full bg-white shadow-elevation-low">
        {/* full-width nav, no max-width wrapper so no growing outer margins */}
        <nav className="flex h-full w-full items-center justify-center">
          {/* single flexbox: height 46.2, padding 0 16 0 8 */}
          <div className="flex h-[46.2px] w-full items-center pl-2 pr-4">
            {/* Item 1: left (flex-1 always) */}
            <div className="flex h-full min-w-0 flex-1 items-center justify-start">
              <button
                type="button"
                className="flex h-full items-center rounded-md pl-1.75 pr-1.25 text-[#a1a5ab] hover:text-[#1d1f25]"
                  aria-label={props.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={props.onToggleSidebar}
                >
                  <IconList className="h-5 w-5" />
                </button>
              <a
                href="#"
                className="mr-1 flex h-full items-center rounded-md px-3 hover:bg-[#f2f2f5]"
                aria-label="Airtable home"
                onClick={e => {
                  e.preventDefault()
                  props.onGoHome()
                }}
              >
                <AirtableBrandLogo className="block h-[22.198px] w-[102px] text-[#2b2b31]" />
              </a>
            </div>

            {/* Item 2: centre */}
            <div
              className={[
                "flex items-center justify-center min-w-0",
                // <900px: centre should be same size as left/right
                "max-[900px]:flex-1",
                // >=901px: centre has fixed width rules
                "min-[901px]:flex-none min-[901px]:w-[300px] min-[1025px]:w-[340px] min-[1400px]:w-[354px]"
              ].join(" ")}
            >
              {/* pill should fill its container (prevents icon-only collapse) */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-8 w-full items-center rounded-full bg-white px-4 shadow-elevation-low shadow-elevation-medium-hover"
                  aria-label="Search"
                  aria-haspopup="dialog"
                  aria-expanded={searchOpen}
                >
                  <IconSearch className="h-4 w-4 text-foreground-subtle" />
                  <span className="ml-2 min-w-0 flex-1 truncate text-left text-[13px] text-foreground-subtle">
                    Search...
                  </span>
                  <span className="ml-2 shrink-0 text-[12px] text-foreground-subtle">ctrl K</span>
                </button>
            </div>

            {/* Item 3: right (flex-1 always) */}
            <div className="flex h-full min-w-0 flex-1 items-center justify-end">
              {/* Demo data (inserted left of Help so other elements don't shift) */}
              <button
                type="button"
                onClick={props.onDemoData}
                disabled={props.demoPending}
                className="ml-0 inline-flex h-7 items-center rounded-full bg-[#f2f2f5] px-3 text-[13px] font-semibold text-[#2b2b31] hover:bg-[#ececf1] disabled:opacity-60"
                aria-label="Generate demo data"
              >
                {props.demoPending ? "Generating..." : "Demo data"}
              </button>
              
              <button
                type="button"
                className="ml-0 inline-flex h-7 items-center rounded-full pl-3 pr-3 text-[13px] text-[#2b2b31] hover:bg-[#e5e5e5] whitespace-nowrap"
                aria-label="Help menu"
              >
                <IconHelp className="h-[16px] w-[16px]" />
                <span className="ml-1">Help</span>
              </button>

              <button
                type="button"
                className="ml-3 mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-elevation-low shadow-elevation-low-hover hover:bg-[#e5e9f0]"
                aria-label="Notifications"
              >
                <IconBell className="h-[20.8px] w-[20.8px]" />
              </button>

              <div className="relative ml-2">
                <button
                  ref={profileBtnRef}
                  type="button"
                  className="flex h-7 w-[27.333px] items-center justify-center rounded-full bg-[#7c3aed] text-[12px] font-semibold text-white shadow-elevation-low shadow-elevation-low-hover border border-white"
                  aria-label="Account"
                  title={props.userName}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen(v => !v)}
                >
                  {props.userName.slice(0, 1).toUpperCase()}
                </button>

                {profileOpen && (
                  <div
                    ref={profileMenuRef}
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-[300] w-[240px] overflow-hidden rounded-[6px] bg-white shadow-elevation-high"
                  >
                    <div className="px-4 py-3">
                      <div className="text-[12px] text-foreground-subtle">Signed in as</div>
                      <div className="mt-0.5 truncate text-[13px] font-semibold text-foreground-default">
                        {props.userName}
                      </div>
                    </div>

                    <div className="h-px bg-[#e3e3e7]" />

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center px-4 py-2.5 text-left text-[13px] text-foreground-default hover:bg-[#f2f2f5]"
                      onClick={() => {
                        window.location.href = "/api/auth/signout"
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              <Link className="sr-only" href="/api/auth/signout">
                Sign out
              </Link>
            </div>
          </div>
        </nav>
      </header>
      {searchOpen && (
        <div className="fixed inset-0 z-[200]">
          {/* overlay */}
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0"
            onClick={closeSearch}
          />

          {/* modal */}
          <div className="pointer-events-none absolute left-1/2 top-[10px] w-[640px] max-w-[calc(100vw-24px)] -translate-x-1/2">
            <div className="pointer-events-auto flex max-h-[calc(100dvh-80px)] w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-elevation-high">
              {/* Row 1: search area */}
              <div className="border-b-[0.667px] border-[#e3e3e7] px-4 py-3 pl-8">
                <div className="flex h-12 items-center">
                  <IconSearch className="h-6 w-6 text-[#1d1f25]" />
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="ml-4 min-w-0 flex-1 bg-transparent text-[18px] text-[#1d1f25] outline-none placeholder:text-foreground-subtle"
                  />
                </div>
              </div>

              {/* Row 2: results */}
              <div className="flex flex-col">
                {/* dropdown: only show when query is non-empty */}
                {searchQuery.trim().length > 0 && (
                  <div className="mt-1 px-6 pt-4 pb-3">
                    <select
                      value={searchType}
                      onChange={e => setSearchType(e.target.value as "all" | "workspaces" | "bases")}
                      className="h-[19.5px] bg-transparent text-[13px] text-foreground-subtle outline-none"
                      aria-label="Filter search results"
                    >
                      <option value="all">Show all types</option>
                      <option value="workspaces">Show workspaces only</option>
                      <option value="bases">Show bases only</option>
                    </select>
                  </div>
                )}

                <div className="max-h-[350px] overflow-auto pr-0 pb-3 pt-0">
                  {searchQuery.trim().length === 0 && (
                    <div className="px-6 pb-2 pt-4 text-[13px] text-foreground-subtle">Recently opened</div>
                  )}

                  {results.length === 0 ? (
                    <div className="px-6 py-6 text-[13px] text-foreground-subtle">No matches</div>
                  ) : (
                    <div className="px-3">
                      {results.map(r => (
                        <button
                          key={`${r.kind}-${r.id}`}
                          type="button"
                          className="flex h-16 w-full items-center rounded-lg px-3 text-left hover:bg-[#f2f2f5]"
                          onClick={() => {
                            if (r.kind === "base") props.onOpenBase(r.id)
                            else props.onOpenWorkspace?.(r.id)
                            closeSearch()
                          }}
                        >
                          {/* left icon (base only) */}
                          {r.kind === "base" ? (
                            <div
                              className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 shadow-elevation-low"
                              style={{ backgroundColor: r.color ?? "#7c3aed" }}
                            >
                              <span className="text-[16px] font-semibold text-white">{baseInitials(r.name)}</span>
                            </div>
                          ) : (
                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white shadow-elevation-low">
                              <span className="text-[12px] text-foreground-subtle">Ws</span>
                            </div>
                          )}

                          {/* middle text */}
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center text-[14px] font-semibold text-[#1d1f25]">
                              <span className="truncate">{r.name}</span>
                              {r.kind === "base" && (
                                <>
                                  <span className="mx-2 text-foreground-subtle">•</span>
                                  <span className="shrink-0 text-foreground-subtle font-normal">Base</span>
                                </>
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-[13px] text-foreground-subtle">
                              {r.kind === "base" ? r.workspaceName : "Workspace"}
                            </div>
                          </div>

                          {/* right aligned last opened */}
                          <div className="ml-4 shrink-0 text-right text-[13px] text-foreground-subtle">
                            {formatLastOpened(r.lastOpenedAt)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              {/* Row 3: shortcut tip */}
              <div className="border-t border-[#e3e3e7] px-6 py-4 text-[13px] text-foreground-subtler">
                Press <span className="mx-1 rounded-md px-1.5 py-0.5 shadow-elevation-low">CTRL</span>
                <span className="mx-1 rounded-md px-1.5 py-0.5 shadow-elevation-low">K</span> any time to search
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
