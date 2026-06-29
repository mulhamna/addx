// Scan filesystem for SKILL.md / cursor rules / copilot instructions.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { HOME } from '../platform/index.js'
import type { AgentId, Scope } from '../platform/paths.js'
import type { DetectedItem, InstalledPlugins } from './types.js'

function readDirSafe(p: string): string[] {
  try {
    return readdirSync(p)
  } catch {
    return []
  }
}

function isDirSafe(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

interface Frontmatter {
  name?: string
  description?: string
}

function parseFrontmatter(content: string): Frontmatter {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) return {}
  const block = m[1] ?? ''
  const fm: Frontmatter = {}
  const lines = block.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) {
      i++
      continue
    }
    const key = kv[1] ?? ''
    const rawValue = (kv[2] ?? '').trim()

    // Folded `>` or literal `|` block scalar
    if (rawValue === '>' || rawValue === '|') {
      const style = rawValue
      const collected: string[] = []
      i++
      while (i < lines.length) {
        const next = lines[i] ?? ''
        if (next === '' || /^\s+/.test(next)) {
          collected.push(next.trim())
          i++
        } else {
          break
        }
      }
      const joined =
        style === '|'
          ? collected.join('\n').replace(/\n+$/, '')
          : collected
              .filter((s) => s !== '')
              .join(' ')
              .trim()
      if (key === 'name') fm.name = joined
      else if (key === 'description') fm.description = joined
      continue
    }

    let value = rawValue
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key === 'name') fm.name = value
    else if (key === 'description') fm.description = value
    i++
  }
  return fm
}

function readSkillMd(dirPath: string): Frontmatter | null {
  const skillFile = path.join(dirPath, 'SKILL.md')
  if (!existsSync(skillFile)) return null
  try {
    const content = readFileSync(skillFile, 'utf8')
    return parseFrontmatter(content)
  } catch {
    return null
  }
}

function scanSkillDir(root: string, agent: AgentId, scope: Scope, idPrefix = ''): DetectedItem[] {
  if (!existsSync(root)) return []
  const out: DetectedItem[] = []
  for (const entry of readDirSafe(root)) {
    if (entry.startsWith('.')) continue
    const dirPath = path.join(root, entry)
    if (!isDirSafe(dirPath)) continue
    const fm = readSkillMd(dirPath)
    if (!fm) continue
    const id = idPrefix ? `${idPrefix}:${entry}` : entry
    out.push({
      id,
      kind: 'skill',
      name: fm.name ?? entry,
      description: fm.description,
      source: { type: 'filesystem', agent, scope, path: dirPath },
    })
  }
  return out
}

function scanPluginBundledSkills(): DetectedItem[] {
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
    const pluginName = pluginKey.split('@')[0] ?? pluginKey
    for (const entry of entries) {
      const skillsDir = path.join(entry.installPath, 'skills')
      out.push(...scanSkillDir(skillsDir, 'claude-code', 'global', pluginName))
    }
  }
  return out
}

function scanCursorRules(root: string, scope: Scope): DetectedItem[] {
  if (!existsSync(root)) return []
  const out: DetectedItem[] = []
  for (const entry of readDirSafe(root)) {
    if (!entry.endsWith('.md') && !entry.endsWith('.mdc')) continue
    const filePath = path.join(root, entry)
    const id = entry.replace(/\.(md|mdc)$/, '')
    let description: string | undefined
    try {
      const fm = parseFrontmatter(readFileSync(filePath, 'utf8'))
      description = fm.description
    } catch {
      // ignore
    }
    out.push({
      id,
      kind: 'skill',
      name: id,
      description,
      source: { type: 'filesystem', agent: 'cursor', scope, path: filePath },
    })
  }
  return out
}

function scanCopilotInstructions(cwd: string): DetectedItem[] {
  const filePath = path.join(cwd, '.github', 'copilot-instructions.md')
  if (!existsSync(filePath)) return []
  return [
    {
      id: 'copilot-instructions',
      kind: 'skill',
      name: 'Copilot Instructions',
      source: { type: 'filesystem', agent: 'vscode', scope: 'project', path: filePath },
    },
  ]
}

export async function detectSkills(cwd: string = process.cwd()): Promise<DetectedItem[]> {
  const out: DetectedItem[] = []
  // Claude global skills
  out.push(...scanSkillDir(path.join(HOME, '.claude', 'skills'), 'claude-code', 'global'))
  // Claude project skills
  out.push(...scanSkillDir(path.join(cwd, '.claude', 'skills'), 'claude-code', 'project'))
  // Claude plugin-bundled skills (from manifest)
  out.push(...scanPluginBundledSkills())
  // Cursor rules
  out.push(...scanCursorRules(path.join(HOME, '.cursor', 'rules'), 'global'))
  out.push(...scanCursorRules(path.join(cwd, '.cursor', 'rules'), 'project'))
  // VSCode/Copilot project instructions (single file)
  out.push(...scanCopilotInstructions(cwd))
  return out
}
