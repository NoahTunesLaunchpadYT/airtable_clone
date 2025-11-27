"use client"

import Link from "next/link"

export function TablesSection(props: {
  selectedBaseId: string
  isLoading: boolean
  tables: { id: string; name: string }[]
  onClear: () => void
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#2b2b31]">Tables</h2>
        <button type="button" className="text-[13px] text-[#1b72e8] hover:underline" onClick={props.onClear}>
          Clear selection
        </button>
      </div>

      <div className="rounded-xl border border-[#e3e3e7] bg-white p-4">
        {props.isLoading && <div className="text-[13px] text-[#6b6b76]">Loading tables...</div>}

        {!props.isLoading && (
          <div className="space-y-2">
            {props.tables.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[#f2f2f5]">
                <div className="text-[13px] font-medium text-[#2b2b31]">{t.name}</div>
                <Link href={`/${props.selectedBaseId}/${t.id}`} className="text-[12px] text-[#1b72e8] hover:underline">
                  Open
                </Link>
              </div>
            ))}

            {props.tables.length === 0 && <div className="text-[13px] text-[#6b6b76]">No tables yet in this base.</div>}
          </div>
        )}
      </div>
    </section>
  )
}
