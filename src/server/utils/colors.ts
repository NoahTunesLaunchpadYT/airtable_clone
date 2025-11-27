// server/utils/colors.ts (or inline in the router)
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function toHex(n: number) {
  return n.toString(16).padStart(2, "0")
}

// "fairly dark pastel": keep components in [0x20, 0xCC] and desaturate toward grey
export function randomPastelHex() {
  const lo = 0x20
  const hi = 0xcc

  let r = lo + Math.floor(Math.random() * (hi - lo + 1))
  let g = lo + Math.floor(Math.random() * (hi - lo + 1))
  let b = lo + Math.floor(Math.random() * (hi - lo + 1))

  const avg = Math.round((r + g + b) / 3)
  r = clamp(Math.round((r + avg * 2) / 3), lo, hi)
  g = clamp(Math.round((g + avg * 2) / 3), lo, hi)
  b = clamp(Math.round((b + avg * 2) / 3), lo, hi)
  
  // print as hex color
  console.log(`Colour picked: #${toHex(r)}${toHex(g)}${toHex(b)}`)

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
