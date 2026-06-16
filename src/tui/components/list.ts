// Compact 1-line list: title left, dim badge right-aligned. Selection = full-width bg strip.

import {
  AMBER,
  BG_SELECTED,
  bg,
  bold,
  dim,
  fg,
  padRight,
  truncate,
  visibleLength,
} from '../draw.js'
import type { Box } from '../layout.js'

export type ListRowKind = 'item' | 'sub'

export interface ListItem<T = unknown> {
  kind: ListRowKind
  label: string
  description?: string
  hint?: string
  data: T
}

export interface ListState {
  items: ListItem[]
  selectedIndex: number
  scrollOffset: number
}

function composeRow(it: ListItem, w: number, isSel: boolean): string {
  const arrow = isSel ? fg(AMBER, '▸') : ' '
  let title: string
  let hint: string
  if (it.kind === 'sub') {
    title = ` ${dim('└─')} ${it.label}`
    hint = it.hint ? dim(it.hint) : ''
  } else {
    const t = isSel ? fg(AMBER, bold(it.label)) : bold(it.label)
    title = ` ${arrow} ${t}`
    hint = it.hint ? dim(it.hint) : ''
  }
  const hintLen = visibleLength(hint)
  const titleVisible = visibleLength(title)
  const minGap = 2
  const available = w - hintLen - 1
  let titleOut = title
  if (titleVisible > available - minGap) {
    // need to truncate title
    titleOut = truncate(title, Math.max(4, available - minGap))
  }
  const titleOutLen = visibleLength(titleOut)
  const fill = Math.max(minGap, w - titleOutLen - hintLen - 1)
  const composed = `${titleOut}${' '.repeat(fill)}${hint} `
  return padRight(composed, w)
}

export function renderList(state: ListState, box: Box): string[] {
  // Auto-scroll
  const visible = box.h
  let scroll = state.scrollOffset
  if (state.selectedIndex < scroll) scroll = state.selectedIndex
  if (state.selectedIndex >= scroll + visible) scroll = state.selectedIndex - visible + 1
  state.scrollOffset = Math.max(0, scroll)

  const lines: string[] = []
  for (let i = state.scrollOffset; i < state.scrollOffset + visible; i++) {
    const it = state.items[i]
    if (!it) {
      lines.push(padRight('', box.w))
      continue
    }
    const isSel = i === state.selectedIndex
    const row = composeRow(it, box.w, isSel)
    lines.push(isSel ? bg(BG_SELECTED, row) : row)
  }
  return lines
}

export function moveSelection(state: ListState, delta: number): void {
  if (state.items.length === 0) return
  state.selectedIndex = Math.max(0, Math.min(state.items.length - 1, state.selectedIndex + delta))
}

export function listHitTest(state: ListState, box: Box, x: number, y: number): number | null {
  if (x < box.x || x >= box.x + box.w) return null
  if (y < box.y || y >= box.y + box.h) return null
  const idx = state.scrollOffset + (y - box.y)
  if (idx < 0 || idx >= state.items.length) return null
  return idx
}
