// Drawing primitives: ANSI color helpers, Unicode box borders.

import type { Box } from './layout.js'

export const RESET = '\x1b[0m'

export const CYAN = 51
export const DIM_GRAY = 244
export const BG_DEEP = 235
export const BG_CYAN = 23
// opencode-style palette
export const AMBER = 214
export const AMBER_BRIGHT = 208
export const BG_SELECTED = 237
export const SOFT_FG = 252

export function fg(code: number, s: string): string {
  return `\x1b[38;5;${code}m${s}${RESET}`
}

export function bg(code: number, s: string): string {
  return `\x1b[48;5;${code}m${s}${RESET}`
}

export function bold(s: string): string {
  return `\x1b[1m${s}${RESET}`
}

export function dim(s: string): string {
  return `\x1b[2m${s}${RESET}`
}

export function reverse(s: string): string {
  return `\x1b[7m${s}${RESET}`
}

export function underline(s: string): string {
  return `\x1b[4m${s}${RESET}`
}

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

/** Strip ANSI escapes — useful when measuring display width. */
export function strip(s: string): string {
  return s.replace(ANSI_RE, '')
}

export function visibleLength(s: string): number {
  return strip(s).length
}

export function padRight(s: string, width: number, ch = ' '): string {
  const len = visibleLength(s)
  if (len >= width) return s
  return s + ch.repeat(width - len)
}

export function padCenter(s: string, width: number): string {
  const len = visibleLength(s)
  if (len >= width) return s
  const total = width - len
  const left = Math.floor(total / 2)
  return ' '.repeat(left) + s + ' '.repeat(total - left)
}

export function truncate(s: string, width: number): string {
  const len = visibleLength(s)
  if (len <= width) return s
  if (width <= 1) return strip(s).slice(0, width)
  return `${strip(s).slice(0, width - 1)}…`
}

export interface BorderChars {
  tl: string
  tr: string
  bl: string
  br: string
  h: string
  v: string
  lT: string
  rT: string
  tT: string
  bT: string
  cross: string
}

export const ROUND: BorderChars = {
  tl: '╭',
  tr: '╮',
  bl: '╰',
  br: '╯',
  h: '─',
  v: '│',
  lT: '├',
  rT: '┤',
  tT: '┬',
  bT: '┴',
  cross: '┼',
}

export interface DrawBoxOpts {
  title?: string
  borderColor?: number
  titleColor?: number
}

/**
 * Render a Unicode border around the given box, optionally with a title in the top edge.
 * Returns h lines, each exactly w chars wide (with ANSI). Caller composites onto a frame.
 */
export function drawBox(box: Box, opts: DrawBoxOpts = {}): string[] {
  const b = ROUND
  const w = box.w
  const h = box.h
  if (w < 2 || h < 2) return Array(h).fill('')

  const colored = (s: string): string => (opts.borderColor != null ? fg(opts.borderColor, s) : s)

  const lines: string[] = []
  const topInner = b.h.repeat(w - 2)
  let topLine: string
  if (opts.title) {
    const t = ` ${opts.title} `
    const titleStr = opts.titleColor != null ? fg(opts.titleColor, bold(t)) : bold(t)
    const visibleT = visibleLength(titleStr)
    const fillCount = Math.max(0, w - 2 - visibleT)
    const leftFill = b.h.repeat(2)
    const rightFill = b.h.repeat(Math.max(0, fillCount - 2))
    topLine = `${colored(b.tl)}${colored(leftFill)}${titleStr}${colored(rightFill)}${colored(b.tr)}`
  } else {
    topLine = `${colored(b.tl)}${colored(topInner)}${colored(b.tr)}`
  }
  lines.push(topLine)

  for (let i = 1; i < h - 1; i++) {
    lines.push(`${colored(b.v)}${' '.repeat(w - 2)}${colored(b.v)}`)
  }
  lines.push(`${colored(b.bl)}${colored(b.h.repeat(w - 2))}${colored(b.br)}`)
  return lines
}

/** Horizontal separator with side T-pieces — for splitting inside an outer border. */
export function drawSeparator(width: number, opts: { borderColor?: number } = {}): string {
  const b = ROUND
  const colored = (s: string): string => (opts.borderColor != null ? fg(opts.borderColor, s) : s)
  return `${colored(b.lT)}${colored(b.h.repeat(Math.max(0, width - 2)))}${colored(b.rT)}`
}

/**
 * Write `content` onto `frame` starting at (x, y).
 * `frame` is a string[] of fixed-width rows. ANSI escapes in `content` are preserved.
 */
export function blit(
  frame: string[],
  y: number,
  x: number,
  content: string,
  frameWidth: number,
): void {
  if (y < 0 || y >= frame.length) return
  const existing = frame[y] ?? ''
  const left = existing.slice(0, ansiSliceIndex(existing, x))
  // We allow content to extend; later content overwrites earlier.
  // Compute right portion after content ends.
  const contentVisible = visibleLength(content)
  const rightStart = x + contentVisible
  const right = ansiSliceFrom(existing, rightStart)
  let combined = left + content + right
  // Trim/pad to frameWidth
  const visLen = visibleLength(combined)
  if (visLen < frameWidth) combined = combined + ' '.repeat(frameWidth - visLen)
  frame[y] = combined
}

/** Compute the actual string index in `s` corresponding to visible column `col`. */
function ansiSliceIndex(s: string, col: number): number {
  let visible = 0
  let i = 0
  while (i < s.length && visible < col) {
    if (s[i] === '\x1b') {
      const close = s.indexOf('m', i)
      if (close === -1) return s.length
      i = close + 1
    } else {
      visible++
      i++
    }
  }
  return i
}

function ansiSliceFrom(s: string, col: number): string {
  const idx = ansiSliceIndex(s, col)
  return s.slice(idx)
}
