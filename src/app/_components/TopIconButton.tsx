"use client"

import type { ReactNode } from "react"

export function TopIconButton(props: { label: string; children: ReactNode }) {
  return (
    <div aria-label={props.label} title={props.label} className="inline-flex items-center justify-center">
      {props.children}
    </div>
  )
}
