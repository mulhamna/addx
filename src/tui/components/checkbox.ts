// Single-line checkbox used in the install modal for selecting target agents.

import type { Box } from '../layout.js'

export interface CheckboxState {
  label: string
  checked: boolean
}

export function renderCheckbox(state: CheckboxState, box: Box): string {
  const mark = state.checked ? '☑' : '☐'
  return `${mark} ${state.label}`.padEnd(box.w).slice(0, box.w)
}
