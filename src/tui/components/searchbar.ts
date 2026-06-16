// Minimal inline search: amber `/` prefix, normal value, dim placeholder.

import { AMBER, dim, fg, padRight } from '../draw.js'
import type { Box } from '../layout.js'

export interface SearchState {
  value: string
  active: boolean
}

export function renderSearchbar(state: SearchState, box: Box): string[] {
  const prefix = fg(AMBER, '/')
  const placeholder = dim('type / to search')
  const cursor = state.active ? fg(AMBER, '▏') : ''
  const text = state.value || (state.active ? '' : placeholder)
  const line = `  ${prefix} ${text}${cursor}`
  return [padRight(line, box.w)]
}

export function applySearchKey(state: SearchState, key: string): boolean {
  if (key === 'backspace') {
    state.value = state.value.slice(0, -1)
    return true
  }
  if (key.length === 1) {
    state.value += key
    return true
  }
  return false
}
