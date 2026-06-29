// Escape-key ladder: one universal back/quit key. esc backs out the deepest active
// layer first; only quits when nothing is open. Pure + unit-tested.

export type EscapeAction = 'help' | 'panel' | 'clearEdit' | 'clearFilter' | 'quit'

export interface EscapeState {
  helpVisible: boolean
  panelOpen: boolean
  /** Search input is in edit mode. */
  searchActive: boolean
  /** A search filter is applied (non-empty value). */
  hasFilter: boolean
}

export function resolveEscape(s: EscapeState): EscapeAction {
  if (s.helpVisible) return 'help'
  if (s.panelOpen) return 'panel'
  if (s.searchActive) return 'clearEdit'
  if (s.hasFilter) return 'clearFilter'
  return 'quit'
}
