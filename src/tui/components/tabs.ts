// Top tab strip with count badges, rendered as clickable chips (button-styled).

import { button, padRight, visibleLength } from '../draw.js'
import type { Box } from '../layout.js'

export interface TabsState {
  tabs: string[]
  selected: number
}

const GAP = ' '
const LEFT_PAD = '  '

function chipText(label: string, count: number): string {
  return `${label} ${count}`
}

/** Visible width of a rendered chip — button() wraps content with two spaces each side. */
function chipWidth(label: string, count: number): number {
  return chipText(label, count).length + 4
}

export function renderTabs(state: TabsState, counts: Record<string, number>, box: Box): string[] {
  const parts: string[] = []
  for (let i = 0; i < state.tabs.length; i++) {
    const label = state.tabs[i] ?? ''
    const count = counts[label] ?? 0
    parts.push(button(chipText(label, count), i === state.selected))
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
    const width = chipWidth(label, count)
    const start = cursor
    const end = cursor + width
    if (x >= start && x < end) return i
    cursor = end + GAP.length
  }
  if (x < LEFT_PAD.length) return 0
  return null
}
