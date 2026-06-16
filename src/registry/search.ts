// Simple substring + tag fuzzy search over registry items.

import type { RegistryItem } from './types.js'

export interface SearchResult {
  item: RegistryItem
  score: number
}

export function searchItems(query: string, items: RegistryItem[]): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (q === '') return items.map((item) => ({ item, score: 0 }))

  const results: SearchResult[] = []
  for (const item of items) {
    const score = scoreItem(q, item)
    if (score > 0) results.push({ item, score })
  }
  results.sort((a, b) => b.score - a.score)
  return results
}

function scoreItem(q: string, item: RegistryItem): number {
  let score = 0
  const id = item.id.toLowerCase()
  const name = item.name.toLowerCase()
  const desc = item.description.toLowerCase()

  if (id === q) score += 100
  else if (id.includes(q)) score += 50

  if (name.toLowerCase().startsWith(q)) score += 30
  else if (name.includes(q)) score += 15

  if (desc.includes(q)) score += 5

  for (const tag of item.tags ?? []) {
    if (tag.toLowerCase() === q) score += 20
    else if (tag.toLowerCase().includes(q)) score += 8
  }
  return score
}

export function findById(id: string, items: RegistryItem[]): RegistryItem | undefined {
  return items.find((i) => i.id === id)
}
