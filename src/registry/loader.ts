// Load and validate registry.json. Bundled alongside the dist file.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Registry, RegistryItem } from './types.js'

const SCHEMA_VERSION = 1

function locateRegistry(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.join(here, '..', '..', 'registry.json'),
    path.join(here, '..', 'registry.json'),
    path.join(process.cwd(), 'registry.json'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  throw new Error(`registry.json not found. Looked in: ${candidates.join(', ')}`)
}

export function loadRegistry(): Registry {
  const file = locateRegistry()
  const raw = readFileSync(file, 'utf8')
  const parsed = JSON.parse(raw) as Registry
  validate(parsed)
  return parsed
}

function validate(r: Registry): void {
  if (r.version !== SCHEMA_VERSION) {
    throw new Error(`Unsupported registry version: ${r.version} (expected ${SCHEMA_VERSION})`)
  }
  if (!Array.isArray(r.items)) {
    throw new Error('registry.items must be an array')
  }
  const ids = new Set<string>()
  for (const item of r.items) {
    validateItem(item)
    if (ids.has(item.id)) throw new Error(`Duplicate registry id: ${item.id}`)
    ids.add(item.id)
  }
}

function validateItem(it: RegistryItem): void {
  if (!it.id || typeof it.id !== 'string') throw new Error('item.id required')
  if (!it.name) throw new Error(`item ${it.id}: name required`)
  if (!it.description) throw new Error(`item ${it.id}: description required`)
  if (!it.type) throw new Error(`item ${it.id}: type required`)
  if (!Array.isArray(it.targets) || it.targets.length === 0) {
    throw new Error(`item ${it.id}: targets required`)
  }
}
