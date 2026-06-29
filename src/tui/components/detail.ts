// Right-side detail panel — opencode style. Variants: registry, detected (single location),
// aggregated (installation matrix), available (install hint), empty.

import type { DetectedItem, DetectedKind } from '../../detectors/types.js'
import type { InstallResult, Scope } from '../../installers/types.js'
import type { RegistryItem } from '../../registry/types.js'
import { AMBER, BG_SELECTED, bg, bold, button, dim, fg, truncate, visibleLength } from '../draw.js'
import type { Box } from '../layout.js'

const GREEN = 40
const RED = 203

export type DetailKind =
  | { kind: 'empty'; message?: string }
  | { kind: 'registry'; item: RegistryItem }
  | { kind: 'detected'; entry: DetectedDetail }
  | { kind: 'aggregated'; group: AggregatedGroup }
  | { kind: 'install'; panel: InstallPanelData }
  | { kind: 'available'; entry: AvailableDetail }

export interface InstallTargetOption {
  id: string
  scope: Scope
  checked: boolean
  detected?: boolean
}

export interface EnvField {
  key: string
  description: string
  required: boolean
  value: string
}

export interface InstallPanelData {
  item: RegistryItem
  scope: Scope
  targets: InstallTargetOption[]
  envFields: EnvField[]
  /** Flat focus index: 0 = scope, 1..N = targets, then env fields. */
  focusIndex: number
  busy?: boolean
  message?: string
  results?: InstallResult[]
}

/** Total focusable rows in the install panel. */
export function installFocusCount(p: InstallPanelData): number {
  return 1 + p.targets.length + p.envFields.length
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
  if (content.kind === 'aggregated') return renderAggregated(content.group, box)
  if (content.kind === 'install') return renderInstallPanel(content.panel, box)
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

function renderAggregated(group: AggregatedGroup, box: Box): string[] {
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
  return padBox(wrap(lines, box.w - 2, box.h), box.w, box.h)
}

function renderInstallPanel(p: InstallPanelData, box: Box): string[] {
  const lines: string[] = []
  const colAgent = 16
  lines.push(fg(AMBER, bold(`Install ${p.item.name}`)))
  lines.push('')
  if (p.item.description) {
    lines.push(p.item.description)
    lines.push('')
  }

  // Result view — shown after an install attempt.
  if (p.results) {
    lines.push(dim('result:'))
    for (const r of p.results) {
      const icon = r.ok ? fg(GREEN, '✓') : fg(RED, '✗')
      const tail = r.ok ? dim(truncate(r.configPath, box.w - 8)) : fg(RED, r.error ?? 'failed')
      lines.push(`  ${icon} ${r.agent.padEnd(colAgent)}${tail}`)
    }
    lines.push('')
    lines.push(dim('enter / esc  ·  close'))
    return padBox(wrap(lines, box.w - 2, box.h), box.w, box.h)
  }

  // Scope radio (focus index 0).
  const scopeFocus = p.focusIndex === 0
  const arrow = (on: boolean): string => (on ? fg(AMBER, '▸') : ' ')
  const radio = (on: boolean, text: string): string =>
    on ? fg(AMBER, `(●) ${text}`) : dim(`( ) ${text}`)
  lines.push(
    `${arrow(scopeFocus)} ${dim('scope'.padEnd(8))}${radio(p.scope === 'project', 'project')}  ${radio(p.scope === 'global', 'global')}`,
  )
  lines.push('')

  // Targets.
  if (p.targets.length === 0) {
    lines.push(dim('targets:  already present in all supported agents'))
  } else {
    lines.push(dim('targets:'))
    for (let i = 0; i < p.targets.length; i++) {
      const t = p.targets[i]
      if (!t) continue
      const isFocus = p.focusIndex === i + 1
      const mark = t.checked ? fg(AMBER, '▣') : dim('☐')
      const tag = t.detected ? fg(GREEN, ' (detected)') : ''
      lines.push(`  ${arrow(isFocus)} ${mark}  ${t.id.padEnd(colAgent)}${tag}`)
    }
  }

  // Env fields.
  if (p.envFields.length > 0) {
    lines.push('')
    lines.push(dim('env:'))
    for (let i = 0; i < p.envFields.length; i++) {
      const f = p.envFields[i]
      if (!f) continue
      const isFocus = p.focusIndex === 1 + p.targets.length + i
      const cursor = isFocus ? fg(AMBER, '▏') : ''
      const req = f.required ? fg(RED, '*') : ' '
      const valBox = bg(BG_SELECTED, ` ${f.value || ''} `)
      lines.push(`  ${arrow(isFocus)}${req}${f.key.padEnd(colAgent)}${valBox}${cursor}`)
    }
  }

  // Actions + hints.
  lines.push('')
  lines.push(
    p.busy ? dim('installing…') : `  ${button('Install', true)}  ${button('Cancel', false)}`,
  )
  lines.push(dim('↑↓ move  ·  space toggle  ·  type env  ·  enter install  ·  esc cancel'))
  if (p.message) lines.push(fg(AMBER, p.message))

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
