export function formatRelative(d?: Date | string | null) {
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

export function toMs(d?: Date | string | null) {
  if (!d) return 0
  return (typeof d === "string" ? new Date(d) : d).getTime()
}
