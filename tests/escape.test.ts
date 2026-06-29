import { describe, expect, test } from 'bun:test'
import { type EscapeState, resolveEscape } from '../src/tui/escape.js'

const base: EscapeState = {
  helpVisible: false,
  panelOpen: false,
  searchActive: false,
  hasFilter: false,
}

describe('tui/escape resolveEscape', () => {
  test('idle quits', () => {
    expect(resolveEscape(base)).toBe('quit')
  })

  test('applied filter clears before quitting', () => {
    expect(resolveEscape({ ...base, hasFilter: true })).toBe('clearFilter')
  })

  test('active search edit clears the filter and exits edit', () => {
    expect(resolveEscape({ ...base, searchActive: true, hasFilter: true })).toBe('clearEdit')
  })

  test('open panel backs out before search/filter', () => {
    expect(resolveEscape({ ...base, panelOpen: true, hasFilter: true })).toBe('panel')
  })

  test('help wins over everything', () => {
    expect(
      resolveEscape({ helpVisible: true, panelOpen: true, searchActive: true, hasFilter: true }),
    ).toBe('help')
  })
})
