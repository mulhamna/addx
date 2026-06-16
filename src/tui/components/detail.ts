// Right-side detail panel — opencode style. Variants: registry, detected (single location),
// aggregated (installation matrix), available (install hint), empty.

import type { DetectedItem, DetectedKind } from '../../detectors/types.js'
import type { RegistryItem } from '../../registry/types.js'
import { AMBER, BG_SELECTED, bg, bold, dim, fg, truncate, visibleLength } from '../draw.js'
import type { Box } from '../layout.js'

export type DetailKind =
  | { kind: 'empty'; message?: string }
  | { kind: 'registry'; item: RegistryItem }
  | { kind: 'detected'; entry: DetectedDetail }
  | { kind: 'aggregated'; group: AggregatedGroup; install?: InstallPanelData }
  | { kind: 'available'; entry: AvailableDetail }

export interface InstallTargetOption {
  id: string
  scope: 'project' | 'global'
  checked: boolean
}

export interface InstallPanelData {
  targets: InstallTargetOption[]
  focusIndex: number
  busy?: boolean
  message?: string
}

export interface DetectedDetail {
  id: string
  name: string
  kind: DetectedKind
  agent: string
  scope: 'project' | 'global'
  location: string
  description?: string
  managedByAddx?: boolean
  rawConfig?: unknown
}

export interface AggregatedLocation {
  agent: string
  scope: 'project' | 'global'
  path: string
  managedByAddx?: boolean
}

export interface AggregatedGroup {
  id: string
  name: string
  kind: DetectedKind
  description?: string
  locations: AggregatedLocation[]
}

export interface AvailableDetail {
  id: string
  name: string
  kind: DetectedKind
  description?: string
  marketplace: string
  installHint: string
  category?: string
  author?: string
  homepage?: string
}

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

export function renderDetail(content: DetailKind, box: Box): string[] {
  if (content.kind === 'empty') {
    return centerLines([dim(content.message ?? 'Select an item to see details.')], box)
  }
  if (content.kind === 'registry') return renderRegistry(content.item, box)
  if (content.kind === 'detected') return renderDetected(content.entry, box)
  if (content.kind === 'aggregated') return renderAggregated(content.group, content.install, box)
  return renderAvailable(content.entry, box)
}

function label(s: string): string {
  return dim(s.padEnd(11))
}

function renderRegistry(item: RegistryItem, box: Box): string[] {
  const lines: string[] = []
  lines.push(fg(AMBER, bold(item.name)))
  lines.push('')
  lines.push(item.description)
  lines.push('')
  if (item.author) lines.push(`${label('author')}${item.author}`)
  const transportInfo = item.transport ? ` (${item.transport.type})` : ''
  lines.push(`${label('type')}${item.type}${transportInfo}`)
  if (item.tags?.length) lines.push(`${label('tags')}${item.tags.join(', ')}`)
  if (item.homepage) lines.push(`${label('home')}${item.homepage}`)
  if (item.repo) lines.push(`${label('repo')}${item.repo}`)
  lines.push(`${label('targets')}${(item.targets as string[]).join(', ')}`)
  return padBox(wrap(lines, box.w - 2, box.h), box.w, box.h)
}

function renderDetected(entry: DetectedDetail, box: Box): string[] {
  const lines: string[] = []
  lines.push(fg(AMBER, bold(entry.name)))
  lines.push('')
  if (entry.description) {
    lines.push(entry.description)
    lines.push('')
  }
  lines.push(`${label('kind')}${entry.kind}`)
  lines.push(`${label('agent')}${entry.agent}`)
  lines.push(`${label('scope')}${entry.scope}`)
  if (entry.managedByAddx !== undefined) {
    const src = entry.managedByAddx ? fg(AMBER, 'via addx') : dim('manual')
    lines.push(`${label('source')}${src}`)
  }
  lines.push(`${label('id')}${entry.id}`)
  lines.push(`${label('path')}${entry.location}`)
  if (entry.rawConfig !== undefined && entry.kind === 'mcp') {
    lines.push('')
    lines.push(dim('config:'))
    const json = JSON.stringify(entry.rawConfig, null, 2)
    for (const ln of json.split('\n')) lines.push(`  ${dim(ln)}`)
  }
  return padBox(wrap(lines, box.w - 2, box.h), box.w, box.h)
}

function renderAggregated(
  group: AggregatedGroup,
  install: InstallPanelData | undefined,
  box: Box,
): string[] {
  const lines: string[] = []
  lines.push(fg(AMBER, bold(group.name)))
  lines.push('')
  if (group.description) {
    lines.push(group.description)
    lines.push('')
  }
  lines.push(`${label('kind')}${group.kind}`)
  lines.push(`${label('locations')}${group.locations.length}`)
  lines.push('')
  lines.push(dim('installed in:'))
  const colAgent = 16
  const colScope = 10
  const innerW = box.w - 2
  const pathWidth = Math.max(10, innerW - 2 - colAgent - colScope)
  for (const loc of group.locations) {
    const agentCol = loc.agent.padEnd(colAgent)
    const scopeCol = loc.scope.padEnd(colScope)
    const pathTrunc = truncate(loc.path, pathWidth)
    const managed = loc.managedByAddx ? fg(AMBER, ' ·via addx') : ''
    lines.push(`  ${agentCol}${dim(scopeCol)}${dim(pathTrunc)}${managed}`)
  }

  if (install) {
    lines.push('')
    if (install.targets.length === 0) {
      lines.push(dim('replicate to:  already in all supported agents'))
    } else {
      lines.push(dim('replicate to:'))
      for (let i = 0; i < install.targets.length; i++) {
        const t = install.targets[i]
        if (!t) continue
        const isFocus = i === install.focusIndex
        const mark = t.checked ? fg(AMBER, '▣') : dim('☐')
        const arrow = isFocus ? fg(AMBER, '▸') : ' '
        const labelText = `${t.id.padEnd(colAgent)}${dim(`(${t.scope})`)}`
        lines.push(`  ${arrow} ${mark}  ${labelText}`)
      }
      lines.push('')
      lines.push(
        dim(
          install.busy
            ? 'installing…'
            : '↑↓ focus  ·  space toggle  ·  enter install  ·  esc cancel',
        ),
      )
      if (install.message) lines.push(fg(AMBER, install.message))
    }
  }

  return padBox(wrap(lines, box.w - 2, box.h), box.w, box.h)
}

function renderAvailable(entry: AvailableDetail, box: Box): string[] {
  const lines: string[] = []
  lines.push(fg(AMBER, bold(entry.name)))
  lines.push('')
  if (entry.description) {
    lines.push(entry.description)
    lines.push('')
  }
  if (entry.author) lines.push(`${label('author')}${entry.author}`)
  if (entry.category) lines.push(`${label('category')}${entry.category}`)
  lines.push(`${label('marketplace')}${entry.marketplace}`)
  if (entry.homepage) lines.push(`${label('home')}${entry.homepage}`)
  lines.push('')
  lines.push(dim('to install:'))
  lines.push(`  ${bg(BG_SELECTED, ` ${entry.installHint} `)}`)
  lines.push('')
  lines.push(dim('(run inside Claude Code)'))
  return padBox(wrap(lines, box.w - 2, box.h), box.w, box.h)
}

function wrap(lines: string[], w: number, h: number): string[] {
  const out: string[] = []
  for (const line of lines) {
    if (visibleLength(line) <= w) {
      out.push(line)
      continue
    }
    // ANSI codes complicate word-wrap. For long lines, drop ANSI and word-wrap plain text.
    const plain = line.replace(ANSI_RE, '')
    out.push(...wordWrap(plain, w))
  }
  // Defensive truncate for any line still over width.
  const guarded = out.map((l) => (visibleLength(l) > w ? truncate(l, w) : l))
  while (guarded.length < h) guarded.push('')
  return guarded.slice(0, h)
}

function wordWrap(text: string, w: number): string[] {
  if (w <= 0) return [text]
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (word === '') continue
    if (word.length > w) {
      if (current) {
        lines.push(current)
        current = ''
      }
      for (let i = 0; i < word.length; i += w) {
        const chunk = word.slice(i, i + w)
        if (i + w >= word.length) current = chunk
        else lines.push(chunk)
      }
      continue
    }
    if (current === '') {
      current = word
    } else if (current.length + 1 + word.length <= w) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

export function buildAggregatedDetail(group: AggregatedGroup): {
  kind: 'aggregated'
  group: AggregatedGroup
} {
  return { kind: 'aggregated', group }
}

export function buildAvailableDetail(item: DetectedItem): AvailableDetail | null {
  if (item.source.type !== 'marketplace') return null
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    description: item.description,
    marketplace: item.source.marketplace,
    installHint: item.source.installHint,
    category: item.source.category,
    author: item.source.author,
    homepage: item.source.homepage,
  }
}

function padBox(lines: string[], w: number, h: number): string[] {
  const out: string[] = []
  for (const line of lines) {
    out.push(` ${line}`)
  }
  while (out.length < h) out.push('')
  return out.slice(0, h)
}

function centerLines(content: string[], box: Box): string[] {
  const out: string[] = Array(box.h).fill('')
  const startY = Math.max(0, Math.floor((box.h - content.length) / 2))
  for (let i = 0; i < content.length; i++) {
    out[startY + i] = content[i] ?? ''
  }
  return out
}
