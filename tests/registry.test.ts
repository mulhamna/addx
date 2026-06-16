import { describe, expect, test } from 'bun:test'
import { loadRegistry } from '../src/registry/loader.js'
import { searchItems } from '../src/registry/search.js'

describe('registry', () => {
  test('loads bundled registry.json', () => {
    const r = loadRegistry()
    expect(r.version).toBe(1)
    expect(Array.isArray(r.items)).toBe(true)
  })

  test('search returns all items for empty query', () => {
    const r = loadRegistry()
    const results = searchItems('', r.items)
    expect(results.length).toBe(r.items.length)
  })

  test('search returns empty for unknown query against empty registry', () => {
    const results = searchItems('nonexistent', [])
    expect(results.length).toBe(0)
  })
})
