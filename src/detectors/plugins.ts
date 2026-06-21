// Detect Claude Code plugins via ~/.claude/plugins/installed_plugins.json manifest.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { HOME } from '../platform/index.js'
import type { DetectedItem, InstalledPlugins } from './types.js'

function readPluginManifestDescription(installPath: string): string | undefined {
  // Try .claude-plugin/plugin.json first, then README.md first non-empty line.
  const manifestCandidates = [
    path.join(installPath, '.claude-plugin', 'plugin.json'),
    path.join(installPath, 'plugin.json'),
  ]
  for (const candidate of manifestCandidates) {
    if (existsSync(candidate)) {
      try {
        const data = JSON.parse(readFileSync(candidate, 'utf8')) as { description?: string }
        if (data.description) return data.description
      } catch {
        // continue
      }
    }
  }
  const readme = path.join(installPath, 'README.md')
  if (existsSync(readme)) {
    try {
      const content = readFileSync(readme, 'utf8')
      const firstPara = content.split(/\n\s*\n/)[0] ?? ''
      const cleaned = firstPara.replace(/^#+\s*/gm, '').trim()
      if (cleaned) return cleaned.slice(0, 200)
    } catch {
      // ignore
    }
  }
  return undefined
}

export async function detectPlugins(_cwd: string = process.cwd()): Promise<DetectedItem[]> {
  const manifestPath = path.join(HOME, '.claude', 'plugins', 'installed_plugins.json')
  if (!existsSync(manifestPath)) return []
  let manifest: InstalledPlugins
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as InstalledPlugins
  } catch {
    return []
  }
  const out: DetectedItem[] = []
  for (const [pluginKey, entries] of Object.entries(manifest.plugins ?? {})) {
    for (const entry of entries) {
      const name = pluginKey.split('@')[0] ?? pluginKey
      const marketplace = pluginKey.split('@')[1] ?? 'unknown'
      const description = readPluginManifestDescription(entry.installPath)
      out.push({
        id: pluginKey,
        kind: 'plugin',
        name,
        description: description ?? `via ${marketplace}, v${entry.version}`,
        source: {
          type: 'filesystem',
          agent: 'claude-code',
          scope: 'global',
          path: entry.installPath,
        },
        rawConfig: entry,
      })
    }
  }
  return out
}
