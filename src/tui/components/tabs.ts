// Top tab strip with count badges. Active = amber+bold+underline + dim count.

import { AMBER, bold, dim, fg, padRight, underline, visibleLength } from '../draw.js'
import type { Box } from '../layout.js'

export interface TabsState {
  tabs: string[]
  selected: number
}

const GAP = '     '
const LEFT_PAD = '   '

export function renderTabs(state: TabsState, counts: Record<string, number>, box: Box): string[] {
  const parts: string[] = []
  for (let i = 0; i < state.tabs.length; i++) {
    const label = state.tabs[i] ?? ''
    const count = counts[label] ?? 0
    const isActive = i === state.selected
    const labelStyled = isActive ? fg(AMBER, underline(bold(label))) : dim(label)
    const countStyled = dim(` ${count}`)
    parts.push(`${labelStyled}${countStyled}`)
  }
  const line = LEFT_PAD + parts.join(GAP)
  if (visibleLength(line) > box.w) return [line]
  return [padRight(line, box.w)]
}

export function tabHitTest(
  state: TabsState,
  counts: Record<string, number>,
  x: number,
): number | null {
  let cursor = LEFT_PAD.length
  for (let i = 0; i < state.tabs.length; i++) {
    const label = state.tabs[i] ?? ''
    const count = counts[label] ?? 0
    const segWidth = label.length + 1 + String(count).length // label + ' ' + count
    const start = cursor
    const end = cursor + segWidth
    if (x >= start && x < end) return i
    cursor = end + GAP.length
  }
  if (x < LEFT_PAD.length) return 0
  return null
}
