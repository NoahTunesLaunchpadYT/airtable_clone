// src/app/airtable-demo/page.tsx
"use client"

import { useMemo, useState } from "react"

type BaseCard = {
  id: string
  name: string
  workspace: string
  updated: string
}

export default function AirtableDemoPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const recentBases = useMemo<BaseCard[]>(
    () => [
      { id: "b1", name: "Demo Base", workspace: "My First Workspace", updated: "Just now" },
      { id: "b2", name: "Content Ops", workspace: "Marketing", updated: "2h ago" },
      { id: "b3", name: "Product Roadmap", workspace: "Product", updated: "Yesterday" }
    ],
    []
  )

  return (
    <div className="h-dvh w-full bg-[#f6f6f8] text-[#1f1f24]">
      {/* Global banner container strip (Airtable has this even when empty) */}
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

          {/* “Airtable” logo area */}
          <a
            href="#"
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[#f2f2f5]"
            aria-label="Airtable home"
          >
            <AirtableMark />
            <span className="text-[13px] font-semibold tracking-[0.01em]">Airtable</span>
          </a>

          {/* Search */}
          <div className="mx-2 flex min-w-0 flex-1 items-center">
            <div className="flex w-full max-w-[680px] items-center gap-2 rounded-lg border border-[#e3e3e7] bg-[#fbfbfc] px-3 py-1.5 focus-within:border-[#c7c7d1]">
              <IconSearch />
              <input
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#7b7b87]"
                placeholder="Search"
              />
              <kbd className="hidden rounded-md border border-[#e3e3e7] bg-white px-1.5 py-0.5 text-[11px] text-[#6b6b76] sm:block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <TopIconButton label="Help">
              <IconHelp />
            </TopIconButton>
            <TopIconButton label="Notifications">
              <IconBell />
            </TopIconButton>
            <div className="ml-1 h-8 w-px bg-[#e9e9ee]" />
            <button
              type="button"
              className="ml-1 flex h-8 items-center gap-2 rounded-md px-2 hover:bg-[#f2f2f5]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b72e8] text-[12px] font-semibold text-white">
                L
              </span>
              <span className="hidden text-[13px] text-[#3a3a42] sm:block">Luna</span>
              <IconChevronDown />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
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
              <SidebarItem collapsed={sidebarCollapsed} active icon={<IconHome />} label="Home" />
              <SidebarItem collapsed={sidebarCollapsed} icon={<IconStar />} label="Starred" />
              <SidebarItem collapsed={sidebarCollapsed} icon={<IconClock />} label="Recents" />
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
              <WorkspaceRow collapsed={sidebarCollapsed} name="My First Workspace" />
              <WorkspaceRow collapsed={sidebarCollapsed} name="Marketing" />
              <WorkspaceRow collapsed={sidebarCollapsed} name="Product" />
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
              <h1 className="text-[22px] font-semibold leading-tight">Home</h1>
              <p className="mt-1 text-[13px] text-[#6b6b76]">
                Pick up where you left off or create something new
              </p>
            </div>

            {/* Recent */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#2b2b31]">Recently opened</h2>
                <button className="text-[13px] text-[#1b72e8] hover:underline" type="button">
                  View all
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentBases.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    className="group rounded-xl border border-[#e3e3e7] bg-white p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] hover:border-[#d6d6df] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold">{b.name}</div>
                        <div className="mt-1 text-[12px] text-[#6b6b76]">{b.workspace}</div>
                      </div>
                      <span className="rounded-md bg-[#f2f2f5] px-2 py-1 text-[11px] text-[#5f5f6b]">
                        Base
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[12px] text-[#6b6b76]">
                      <span>Updated</span>
                      <span className="text-[#4b4b55]">{b.updated}</span>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f2f2f5]">
                      <div className="h-full w-[52%] rounded-full bg-[#1b72e8] opacity-80 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Create new */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#2b2b31]">Start with</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <CreateCard title="Blank base" subtitle="Start from scratch" badge="Free" />
                <CreateCard title="Import data" subtitle="CSV, Google Sheets, more" badge="Quick" />
                <CreateCard title="Templates" subtitle="Pick a suggested starting point" badge="Popular" />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------- Small UI helpers ---------- */

function TopIconButton(props: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f2f2f5] active:bg-[#ececf1]"
    >
      {props.children}
    </button>
  )
}

function SidebarItem(props: {
  collapsed: boolean
  label: string
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
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

function WorkspaceRow(props: { collapsed: boolean; name: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#3a3a42] hover:bg-[#f2f2f5]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f2f2f5]">
        <IconGrid />
      </span>
      {!props.collapsed && <span className="truncate">{props.name}</span>}
    </button>
  )
}

function CreateCard(props: { title: string; subtitle: string; badge: string }) {
  return (
    <button
      type="button"
      className="rounded-xl border border-[#e3e3e7] bg-white p-4 text-left hover:border-[#d6d6df] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold">{props.title}</div>
          <div className="mt-1 text-[12px] text-[#6b6b76]">{props.subtitle}</div>
        </div>
        <span className="rounded-md bg-[#f2f2f5] px-2 py-1 text-[11px] text-[#5f5f6b]">
          {props.badge}
        </span>
      </div>
    </button>
  )
}

/* ---------- Minimal inline icons ---------- */

function AirtableMark() {
  return (
    <span className="relative inline-flex h-5 w-5">
      <span className="absolute left-0 top-0 h-3.5 w-3.5 rotate-12 rounded bg-[#f2c94c]" />
      <span className="absolute right-0 top-0 h-3.5 w-3.5 -rotate-12 rounded bg-[#eb5757]" />
      <span className="absolute bottom-0 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded bg-[#56ccf2]" />
    </span>
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
      <path
        d="M9 15a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M13.8 13.8 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 18a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Z"
        fill="currentColor"
        opacity="0.9"
      />
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
      <path
        d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
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
function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
      <path
        d="M10 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M16.8 10a6.9 6.9 0 0 0-.1-1l1.4-1.1-1.5-2.6-1.7.7a7 7 0 0 0-1.7-1l-.3-1.8H7.1l-.3 1.8a7 7 0 0 0-1.7 1l-1.7-.7L1.9 7.9 3.3 9a6.9 6.9 0 0 0 0 2l-1.4 1.1 1.5 2.6 1.7-.7c.5.4 1.1.7 1.7 1l.3 1.8h5.8l.3-1.8c.6-.3 1.2-.6 1.7-1l1.7.7 1.5-2.6L16.7 11c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
