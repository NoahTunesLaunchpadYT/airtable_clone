"use client"

import React from "react"

export type EditableCellProps = {
  id: string
  value: string

  isSelected: boolean
  isEditing: boolean
  disabled?: boolean

  onMouseDownSelect: () => void
  onDoubleClickEdit: () => void

  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>
  onChange: (next: string) => void

  onBlurEditing: () => void
  onFocusSelect?: () => void
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>
}

export default function EditableCell(props: EditableCellProps) {
  const base =
    "h-full w-full bg-transparent text-[12px] outline-none px-0 disabled:text-gray-400 " +
    "selection:bg-transparent" // keeps selection UI quieter

  const selectedStyle = props.isSelected && !props.isEditing
    ? "text-[#166ee1] caret-transparent"
    : "text-gray-800 caret-auto"

  return (
    <input
      id={props.id}
      name={props.id}
      className={[base, selectedStyle].join(" ")}
      value={props.value}
      disabled={props.disabled}
      readOnly={!props.isEditing}
      tabIndex={props.isSelected || props.isEditing ? 0 : -1}
      onMouseDown={(e) => {
        // prevent the browser from placing a caret (we control selection vs edit)
        e.preventDefault()
        props.onMouseDownSelect()
      }}
      onDoubleClick={(e) => {
        e.preventDefault()
        props.onDoubleClickEdit()
      }}
      onKeyDown={props.onKeyDown}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={() => {
        if (props.isEditing) props.onBlurEditing()
      }}
      onFocus={props.onFocusSelect}
      onPaste={props.onPaste}
      // discourage autofill
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode="text"
    />
  )
}
