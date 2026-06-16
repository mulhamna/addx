// Scan ~/.claude/plugins/marketplaces/*/.claude-plugin/marketplace.json for plugins not yet installed.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { HOME } from '../platform/index.js'
import type { DetectedItem } from './types.js'

interface MarketplacePlugin {
  name: string
  description?: string
  category?: string
  author?: { name?: string }
  homepage?: string
}

interface Marketplace {
  name?: string
  plugins?: MarketplacePlugin[]
}

interface InstalledManifest {
  version: number
  plugins: Record<string, unknown>
}

function readJsonSafe<T>(p: string): T | null {
  try {
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    return null
  }
}

function isDirSafe(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

export async function detectAvailable(): Promise<DetectedItem[]> {
  const marketplacesRoot = path.join(HOME, '.claude', 'plugins', 'marketplaces')
  if (!existsSync(marketplacesRoot)) return []

  const installedManifest = readJsonSafe<InstalledManifest>(
    path.join(HOME, '.claude', 'plugins', 'installed_plugins.json'),
  )
  const installedKeys = new Set(Object.keys(installedManifest?.plugins ?? {}))

  const out: DetectedItem[] = []
  let entries: string[] = []
  try {
    entries = readdirSync(marketplacesRoot)
  } catch {
    return []
  }

  for (const dirName of entries) {
    if (dirName.startsWith('.') || dirName.endsWith('.bak')) continue
    const dir = path.join(marketplacesRoot, dirName)
    if (!isDirSafe(dir)) continue
    const manifestPath = path.join(dir, '.claude-plugin', 'marketplace.json')
    const marketplace = readJsonSafe<Marketplace>(manifestPath)
    if (!marketplace?.plugins?.length) continue

    const marketplaceName = marketplace.name ?? dirName
    for (const plugin of marketplace.plugins) {
      const key = `${plugin.name}@${marketplaceName}`
      if (installedKeys.has(key)) continue
      out.push({
        id: key,
        kind: 'plugin',
        name: plugin.name,
        description: plugin.description,
        source: {
          type: 'marketplace',
          agent: 'claude-code',
          marketplace: marketplaceName,
          pluginName: plugin.name,
          installHint: `/plugin install ${plugin.name}@${marketplaceName}`,
          category: plugin.category,
          author: plugin.author?.name,
          homepage: plugin.homepage,
        },
      })
    }
  }
  return out
}
