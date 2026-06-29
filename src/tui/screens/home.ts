// Main browse screen — opencode-style edge-to-edge layout, aggregated rows, expand on enter.

import { scanAll } from '../../detectors/index.js'
import type { DetectedItem, DetectedKind } from '../../detectors/types.js'
import { isInstalledSource } from '../../detectors/types.js'
import { detectInstalledAgents, installItem } from '../../installers/index.js'
import type { AgentId } from '../../platform/paths.js'
import { ALL_AGENTS } from '../../platform/paths.js'
import { loadRegistry } from '../../registry/loader.js'
import type { RegistryItem, Transport } from '../../registry/types.js'
import { isAddxManaged, loadState } from '../../state/store.js'
import type { InstallState } from '../../state/types.js'
import { VERSION } from '../../utils/version.js'
import {
  type AggregatedGroup,
  type AggregatedLocation,
  type AvailableDetail,
  type DetailKind,
  type DetectedDetail,
  type EnvField,
  type InstallPanelData,
  type InstallTargetOption,
  buildAvailableDetail,
  installFocusCount,
  renderDetail,
} from '../components/detail.js'
import { type ListState, listHitTest, moveSelection, renderList } from '../components/list.js'
import { type SearchState, applySearchKey, renderSearchbar } from '../components/searchbar.js'
import { renderStatusbar } from '../components/statusbar.js'
import { type TabsState, renderTabs, tabHitTest } from '../components/tabs.js'
import {
  AMBER,
  BG_BAR,
  BG_DEEP,
  DIM_GRAY,
  blit,
  bold,
  dim,
  drawBox,
  fg,
  padRight,
  withBg,
} from '../draw.js'
import { resolveEscape } from '../escape.js'
import { box, splitHorizontal, splitVertical } from '../layout.js'
import { Renderer } from '../renderer.js'

type TabKey = 'All' | 'MCP' | 'Skills' | 'Plugins' | 'Installed'
const TABS: TabKey[] = ['All', 'MCP', 'Skills', 'Plugins', 'Installed']

interface RowData {
  type: 'aggregated' | 'sub' | 'available' | 'registry'
  groupKey?: string
  detail: DetailKind
  searchHaystack: string
}

export async function launchHome(): Promise<void> {
  const registry = loadRegistry()
  const tabs: TabsState = { tabs: TABS as unknown as string[], selected: 0 }
  const search: SearchState = { value: '', active: false }
  const list: ListState = { items: [], selectedIndex: 0, scrollOffset: 0 }
  const expanded = new Set<string>()

  let detected: DetectedItem[] = []
  let detectLoaded = false
  let installState: InstallState = { version: 1, installs: [] }
  let statusMsg = ''
  let aggregateSkills = false
  let installPanel: InstallPanelData | null = null
  let helpVisible = false

  const HELP_BINDINGS: Array<[string, string]> = [
    ['↑ ↓', 'navigate list'],
    ['enter', 'expand group / install'],
    ['i', 'install selected'],
    ['s', 'toggle skill aggregate'],
    ['tab', 'next tab'],
    ['/', 'search'],
    ['?', 'toggle this help'],
    ['esc', 'back · clear · quit'],
    ['q', 'quit (when idle)'],
  ]

  function renderHelpOverlay(frame: string[], size: { w: number; h: number }): void {
    const rows = HELP_BINDINGS.map(([k, d]) => `${fg(AMBER, k.padEnd(7))}${d}`)
    const boxW = Math.min(size.w - 4, 40)
    const boxH = rows.length + 2
    const boxX = Math.max(0, Math.floor((size.w - boxW) / 2))
    const boxY = Math.max(0, Math.floor((size.h - boxH) / 2))
    const lines = drawBox(box(boxX, boxY, boxW, boxH), {
      title: 'keybindings',
      borderColor: AMBER,
      titleColor: AMBER,
    })
    for (let i = 0; i < lines.length; i++) {
      blit(frame, boxY + i, boxX, withBg(BG_DEEP, lines[i] ?? '', boxW), size.w)
    }
    for (let i = 0; i < rows.length; i++) {
      blit(frame, boxY + 1 + i, boxX + 2, rows[i] ?? '', size.w)
    }
  }

  async function refreshDetected(): Promise<void> {
    installState = await loadState()
    detected = await scanAll(process.cwd())
    detectLoaded = true
  }

  function currentTab(): TabKey {
    return TABS[tabs.selected] ?? 'All'
  }

  function detectedToDetail(d: DetectedItem): DetectedDetail {
    const isAgentSource = d.source.type === 'agent-config'
    const isFs = d.source.type === 'filesystem'
    const agent = d.source.agent
    const scope =
      d.source.type === 'agent-config' || d.source.type === 'filesystem' ? d.source.scope : 'global'
    const location = isAgentSource
      ? d.source.type === 'agent-config'
        ? d.source.configPath
        : ''
      : isFs && d.source.type === 'filesystem'
        ? d.source.path
        : ''
    const managed =
      d.kind === 'mcp' && isInstalledSource(d.source)
        ? isAddxManaged(installState, d.id, agent, scope)
        : undefined
    return {
      id: d.id,
      name: d.name,
      kind: d.kind,
      agent,
      scope,
      location,
      description: d.description,
      managedByAddx: managed,
      rawConfig: d.rawConfig,
    }
  }

  function aggregationKey(it: DetectedItem): string {
    if (it.kind === 'skill' && aggregateSkills) {
      const tail = it.id.includes(':') ? it.id.split(':').slice(1).join(':') : it.id
      return `skill::${tail}`
    }
    return `${it.kind}::${it.id.split('@')[0]}`
  }

  function buildGroups(items: DetectedItem[]): {
    groups: AggregatedGroup[]
    byKey: Map<string, DetectedItem[]>
  } {
    const byKey = new Map<string, DetectedItem[]>()
    for (const it of items) {
      const key = aggregationKey(it)
      const arr = byKey.get(key) ?? []
      arr.push(it)
      byKey.set(key, arr)
    }
    const groups: AggregatedGroup[] = []
    for (const [, members] of byKey) {
      const first = members[0]
      if (!first) continue
      const locations: AggregatedLocation[] = members.map((m) => {
        const detail = detectedToDetail(m)
        return {
          agent: detail.agent,
          scope: detail.scope,
          path: detail.location,
          managedByAddx: detail.managedByAddx,
        }
      })
      groups.push({
        id: first.id,
        kind: first.kind,
        name: first.name,
        description: first.description,
        locations,
      })
    }
    return { groups, byKey }
  }

  function rowsFromInstalledGroups(groups: AggregatedGroup[]): RowData[] {
    const rows: RowData[] = []
    for (const g of groups) {
      const key = `${g.kind}::${g.id}`
      const locCount = g.locations.length
      const installedManaged = g.locations.filter((l) => l.managedByAddx).length
      const managedBadge = installedManaged > 0 ? ` · ${installedManaged} managed` : ''
      const first = g.locations[0]
      const locText = locCount === 1 && first ? first.agent : `${locCount} locations`
      const badge = `[${g.kind} · ${locText}${managedBadge}]`
      rows.push({
        type: 'aggregated',
        groupKey: key,
        detail: { kind: 'aggregated', group: g } satisfies DetailKind,
        searchHaystack: `${g.id} ${g.name} ${g.description ?? ''} ${g.locations
          .map((l) => `${l.agent} ${l.scope}`)
          .join(' ')}`.toLowerCase(),
      })
      // pseudo ListItem injection — actual ListItem will be built in `assembleListItems`
      // store badge + description in detail for now via metadata sidecar
      ;(rows[rows.length - 1] as RowDataInternal).label = g.name
      ;(rows[rows.length - 1] as RowDataInternal).description = oneLine(g.description)
      ;(rows[rows.length - 1] as RowDataInternal).hint = badge

      if (expanded.has(key)) {
        for (const loc of g.locations) {
          const subDetail: DetectedDetail = {
            id: g.id,
            name: g.name,
            kind: g.kind,
            agent: loc.agent,
            scope: loc.scope,
            location: loc.path,
            description: g.description,
            managedByAddx: loc.managedByAddx,
          }
          const subRow: RowDataInternal = {
            type: 'sub',
            groupKey: key,
            detail: { kind: 'detected', entry: subDetail } satisfies DetailKind,
            searchHaystack: '',
            label: `${loc.agent}  ${dim(`(${loc.scope})`)}`,
            hint: loc.managedByAddx ? 'via addx' : 'manual',
          }
          rows.push(subRow)
        }
      }
    }
    return rows
  }

  function rowsFromAvailable(items: DetectedItem[]): RowData[] {
    const rows: RowData[] = []
    for (const it of items) {
      const avail: AvailableDetail | null = buildAvailableDetail(it)
      if (!avail) continue
      const row: RowDataInternal = {
        type: 'available',
        detail: { kind: 'available', entry: avail } satisfies DetailKind,
        searchHaystack:
          `${it.id} ${it.name} ${it.description ?? ''} ${avail.category ?? ''}`.toLowerCase(),
        label: avail.name,
        description: oneLine(avail.description),
        hint: `[${avail.kind} · ${avail.marketplace} · available]`,
      }
      rows.push(row)
    }
    return rows
  }

  function rowsFromRegistry(items: RegistryItem[]): RowData[] {
    return items.map(
      (item): RowDataInternal => ({
        type: 'registry',
        detail: { kind: 'registry', item } satisfies DetailKind,
        searchHaystack: `${item.id} ${item.name} ${item.description}`.toLowerCase(),
        label: item.name,
        description: oneLine(item.description),
        hint: `[${item.type} · registry]`,
      }),
    )
  }

  function rowsForTab(tab: TabKey): RowData[] {
    const installedItems = detected.filter((d) => isInstalledSource(d.source))
    const availableItems = detected.filter((d) => d.source.type === 'marketplace')

    let installedFiltered = installedItems
    let availableFiltered = availableItems
    let registryFiltered = registry.items

    const wantKind = (k: DetectedKind): boolean =>
      tab === 'All' ||
      (tab === 'MCP' && k === 'mcp') ||
      (tab === 'Skills' && k === 'skill') ||
      (tab === 'Plugins' && k === 'plugin')

    if (tab === 'Installed') {
      availableFiltered = []
      registryFiltered = []
    } else {
      installedFiltered = installedFiltered.filter((d) => wantKind(d.kind))
      availableFiltered = availableFiltered.filter((d) => wantKind(d.kind))
      registryFiltered = registryFiltered.filter((i) => wantKind(i.type as DetectedKind))
    }

    const { groups } = buildGroups(installedFiltered)
    groups.sort((a, b) => a.name.localeCompare(b.name))

    return [
      ...rowsFromInstalledGroups(groups),
      ...rowsFromRegistry(registryFiltered),
      ...rowsFromAvailable(availableFiltered),
    ]
  }

  const tabCounts: Record<string, number> = {}

  function refreshList(): void {
    // Compute counts pre-search-filter for each tab.
    for (const t of TABS) tabCounts[t] = rowsForTab(t).length

    let rows = rowsForTab(currentTab())
    if (search.value) {
      const q = search.value.toLowerCase()
      rows = rows.filter((r) => r.searchHaystack.includes(q))
    }
    list.items = rows.map((r) => {
      const ri = r as RowDataInternal
      return {
        kind: r.type === 'sub' ? 'sub' : 'item',
        label: ri.label ?? '',
        description: ri.description,
        hint: ri.hint,
        data: r,
      }
    })
    if (list.selectedIndex >= list.items.length) {
      list.selectedIndex = Math.max(0, list.items.length - 1)
    }
  }

  function expandTargets(targets: (AgentId | '*')[]): AgentId[] {
    if (targets.includes('*')) return [...ALL_AGENTS]
    return targets.filter((t): t is AgentId => t !== '*')
  }

  /**
   * Re-run real on-disk detection for the open panel's scope: mark/pre-check agents whose
   * config file actually exists, and float the detected ones to the top.
   */
  async function applyDetection(): Promise<void> {
    const p = installPanel
    if (!p) return
    const installed = new Set<string>(await detectInstalledAgents(p.scope, process.cwd()))
    for (const t of p.targets) {
      t.scope = p.scope
      t.detected = installed.has(t.id)
      t.checked = installed.has(t.id)
    }
    p.targets.sort((a, b) => Number(b.detected) - Number(a.detected))
    p.focusIndex = 0
    renderer.schedulePaint()
  }

  /** Open the install panel for a registry item, skipping agents that already have it. */
  function openInstallPanel(item: RegistryItem, occupiedAgents: Set<string>): void {
    const targets: InstallTargetOption[] = expandTargets(item.targets)
      .filter((a) => !occupiedAgents.has(a))
      .map((a) => ({ id: a, scope: 'global', checked: false, detected: false }))
    const envFields: EnvField[] = (item.env ?? []).map((e) => ({
      key: e.key,
      description: e.description,
      required: e.required ?? false,
      value: e.default ?? '',
    }))
    installPanel = { item, scope: 'global', targets, envFields, focusIndex: 0 }
    void applyDetection()
  }

  function mcpToRegistryItem(group: AggregatedGroup): RegistryItem | null {
    const firstLoc = group.locations[0]
    if (!firstLoc) return null
    // find the DetectedItem with rawConfig for this group
    const detectedHit = detected.find(
      (d) =>
        d.kind === 'mcp' &&
        aggregationKey(d) === `${group.kind}::${group.id.split('@')[0]}` &&
        d.rawConfig,
    )
    const raw = detectedHit?.rawConfig as Record<string, unknown> | undefined
    if (!raw) return null
    let transport: Transport
    if (typeof raw.command === 'string') {
      transport = {
        type: 'stdio',
        command: raw.command,
        args: (raw.args as string[] | undefined) ?? [],
        env: (raw.env as Record<string, string> | undefined) ?? {},
      }
    } else if (typeof raw.url === 'string') {
      const t = (raw.type as string) === 'sse' ? 'sse' : 'http'
      transport = { type: t, url: raw.url }
    } else {
      return null
    }
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? '',
      type: 'mcp',
      transport,
      targets: ['*'],
    }
  }

  async function executeInstall(): Promise<void> {
    if (!installPanel) return
    const checked = installPanel.targets.filter((t) => t.checked)
    if (checked.length === 0) {
      installPanel.message = 'pick at least 1 target (space toggles)'
      renderer.schedulePaint()
      return
    }
    const missing = installPanel.envFields.filter((f) => f.required && !f.value.trim())
    if (missing.length > 0) {
      installPanel.message = `fill required env: ${missing.map((f) => f.key).join(', ')}`
      renderer.schedulePaint()
      return
    }
    const env: Record<string, string> = {}
    for (const f of installPanel.envFields) if (f.value.trim()) env[f.key] = f.value
    installPanel.message = undefined
    installPanel.busy = true
    renderer.schedulePaint()
    const targets = checked.map((t) => t.id as AgentId)
    const results = await installItem(installPanel.item, targets, {
      scope: installPanel.scope,
      cwd: process.cwd(),
      env,
    })
    installPanel.busy = false
    installPanel.results = results
    await refreshDetected()
    refreshList()
    const ok = results.filter((r) => r.ok).length
    const failed = results.length - ok
    statusMsg = `installed to ${ok} agent${ok === 1 ? '' : 's'}${failed ? ` · ${failed} failed` : ''}`
    setTimeout(() => {
      statusMsg = ''
      renderer.schedulePaint()
    }, 3500)
    renderer.schedulePaint()
  }

  function flashMsg(msg: string, ms = 2500): void {
    statusMsg = msg
    setTimeout(() => {
      statusMsg = ''
      renderer.schedulePaint()
    }, ms)
  }

  /** Open the install panel for the selected row (detected MCP group or registry item). */
  function tryInstallSelected(): void {
    const row = list.items[list.selectedIndex]?.data as RowData | undefined
    if (!row) return
    if (row.type === 'aggregated') {
      const group = (row.detail as { kind: 'aggregated'; group: AggregatedGroup }).group
      if (group.kind !== 'mcp') {
        flashMsg('install via addx only supports MCP right now')
        return
      }
      const item = mcpToRegistryItem(group)
      if (!item) {
        flashMsg('no config snapshot for this MCP — cannot replicate')
        return
      }
      openInstallPanel(item, new Set(group.locations.map((l) => l.agent)))
    } else if (row.type === 'registry') {
      const item = (row.detail as { kind: 'registry'; item: RegistryItem }).item
      if (item.type !== 'mcp') {
        flashMsg('install via addx only supports MCP right now')
        return
      }
      const occupied = new Set<string>()
      for (const d of detected) {
        if (
          d.id.split('@')[0] === item.id &&
          (d.source.type === 'agent-config' || d.source.type === 'filesystem')
        )
          occupied.add(d.source.agent)
      }
      openInstallPanel(item, occupied)
    }
  }

  function emptyMessage(): string {
    if (!detectLoaded) return 'Scanning agent configs + skills + plugins + marketplaces…'
    if (currentTab() === 'Installed') return 'Nothing installed yet.'
    return 'Nothing matches.'
  }

  refreshList()
  void refreshDetected().then(() => {
    refreshList()
    renderer.schedulePaint()
  })

  const renderer = new Renderer({
    render: (size) => {
      const frameBox = box(0, 0, size.w, size.h)
      // Layout: header(0) tabs(1) sep(2) search(3) sep(4) body(5..n-2) status(n-1)
      const [, restAfterHeader] = splitVertical(frameBox, 1)
      const [, restAfterTabs] = splitVertical(restAfterHeader, 1)
      const [, restAfterSep] = splitVertical(restAfterTabs, 1)
      const [, restAfterSearch] = splitVertical(restAfterSep, 1)
      const [, restAfterSep2] = splitVertical(restAfterSearch, 1)
      const [bodyArea, statusArea] = splitVertical(restAfterSep2, restAfterSep2.h - 1)
      const leftWidth = Math.max(30, Math.floor(bodyArea.w * 0.48))
      const [listBox, detailBox] = splitHorizontal(bodyArea, leftWidth, 1)

      const frame: string[] = Array(size.h).fill(padRight('', size.w))

      // Header row
      const brand = `${fg(AMBER, '▲')} ${bold('addx')} ${dim(`v${VERSION}`)}`
      const subtitle = dim('universal AI tools manager')
      frame[0] = padRight(`  ${brand}   ${subtitle}`, size.w)

      // Tabs row
      frame[1] = renderTabs(tabs, tabCounts, box(0, 1, size.w, 1))[0] ?? ''

      // Separator
      frame[2] = fg(DIM_GRAY, '─'.repeat(size.w))

      // Search row
      frame[3] = renderSearchbar(search, box(0, 3, size.w, 1))[0] ?? ''

      // Separator
      frame[4] = fg(DIM_GRAY, '─'.repeat(size.w))

      // List
      if (list.items.length === 0) {
        const msg = dim(emptyMessage())
        const mid = listBox.y + Math.floor(listBox.h / 2)
        blit(frame, mid, listBox.x + 2, msg, size.w)
      } else {
        const lines = renderList(list, listBox)
        for (let i = 0; i < lines.length; i++) {
          blit(frame, listBox.y + i, listBox.x, lines[i] ?? '', size.w)
        }
      }

      // Detail
      const selectedRow = list.items[list.selectedIndex]?.data as RowData | undefined
      let detailKind: DetailKind = selectedRow
        ? selectedRow.detail
        : { kind: 'empty', message: emptyMessage() }
      if (installPanel) detailKind = { kind: 'install', panel: installPanel }
      const detailLines = renderDetail(detailKind, detailBox)
      for (let i = 0; i < detailLines.length; i++) {
        blit(frame, detailBox.y + i, detailBox.x, detailLines[i] ?? '', size.w)
      }

      // Vertical divider
      for (let i = 0; i < bodyArea.h; i++) {
        blit(frame, bodyArea.y + i, listBox.x + listBox.w, fg(DIM_GRAY, '│'), size.w)
      }

      // Status
      const count = list.items.length
      const pos = count > 0 ? `${list.selectedIndex + 1}/${count}` : '0/0'
      const leftStatus = search.active
        ? 'type to filter  ·  esc finish'
        : installPanel
          ? '↑↓ focus  ·  space toggle  ·  enter install  ·  esc cancel'
          : statusMsg || '↑↓ nav  ·  enter expand  ·  i install  ·  / search  ·  ? help  ·  q quit'
      const rightStatus = `${pos}  ·  addx v${VERSION}`
      frame[statusArea.y] =
        renderStatusbar({ left: leftStatus, right: rightStatus }, statusArea)[0] ?? ''

      // Background pass: bars get BG_BAR, everything else the deep app background.
      const barRows = new Set([0, 3, statusArea.y])
      for (let i = 0; i < frame.length; i++) {
        const code = barRows.has(i) ? BG_BAR : BG_DEEP
        frame[i] = withBg(code, frame[i] ?? '', size.w)
      }

      if (helpVisible) renderHelpOverlay(frame, size)
      return frame
    },

    onKey: (e) => {
      if (e.name === 'ctrl-c') {
        renderer.unmount()
        process.exit(0)
      }
      // Universal back/quit ladder — esc backs out the deepest layer, quits when idle.
      if (e.name === 'escape') {
        if (installPanel?.busy) return
        switch (
          resolveEscape({
            helpVisible,
            panelOpen: installPanel !== null,
            searchActive: search.active,
            hasFilter: search.value.length > 0,
          })
        ) {
          case 'help':
            helpVisible = false
            break
          case 'panel':
            installPanel = null
            break
          case 'clearEdit':
            search.active = false
            search.value = ''
            refreshList()
            break
          case 'clearFilter':
            search.value = ''
            refreshList()
            break
          case 'quit':
            renderer.unmount()
            process.exit(0)
        }
        renderer.schedulePaint()
        return
      }
      if (helpVisible) {
        if (e.name === '?' || e.name === 'q') helpVisible = false
        renderer.schedulePaint()
        return
      }
      if (search.active) {
        if (e.name === 'enter') search.active = false
        else if (applySearchKey(search, e.name)) refreshList()
        renderer.schedulePaint()
        return
      }
      if (installPanel) {
        if (installPanel.busy) return
        const p = installPanel
        // Result view: enter closes the panel (esc handled by the ladder above).
        if (p.results) {
          if (e.name === 'enter') installPanel = null
          renderer.schedulePaint()
          return
        }
        const targetStart = 1
        const envStart = 1 + p.targets.length
        const onScope = p.focusIndex === 0
        const onTarget = p.focusIndex >= targetStart && p.focusIndex < envStart
        const envIdx = p.focusIndex - envStart
        const onEnv = envIdx >= 0 && envIdx < p.envFields.length
        if (e.name === 'up') {
          p.focusIndex = Math.max(0, p.focusIndex - 1)
        } else if (e.name === 'down') {
          p.focusIndex = Math.min(installFocusCount(p) - 1, p.focusIndex + 1)
        } else if (e.name === 'enter') {
          void executeInstall()
        } else if (
          onScope &&
          (e.name === 'space' || e.name === ' ' || e.name === 'left' || e.name === 'right')
        ) {
          p.scope = p.scope === 'global' ? 'project' : 'global'
          void applyDetection()
        } else if (onTarget && (e.name === 'space' || e.name === ' ')) {
          const t = p.targets[p.focusIndex - targetStart]
          if (t) t.checked = !t.checked
        } else if (onEnv) {
          const f = p.envFields[envIdx]
          if (f) {
            if (e.name === 'backspace') f.value = f.value.slice(0, -1)
            else if (e.name === 'space' || e.name === ' ') f.value += ' '
            else if (e.name.length === 1) f.value += e.name
          }
        }
        renderer.schedulePaint()
        return
      }
      switch (e.name) {
        case 'q':
          renderer.unmount()
          process.exit(0)
          break
        case '/':
          search.active = true
          break
        case '?':
          helpVisible = true
          break
        case 'up':
          moveSelection(list, -1)
          break
        case 'down':
          moveSelection(list, 1)
          break
        case 'tab':
          tabs.selected = (tabs.selected + 1) % TABS.length
          search.value = ''
          refreshList()
          break
        case 'enter': {
          const row = list.items[list.selectedIndex]?.data as RowData | undefined
          if (!row) break
          if (row.type === 'aggregated' && row.groupKey) {
            if (expanded.has(row.groupKey)) expanded.delete(row.groupKey)
            else expanded.add(row.groupKey)
            refreshList()
          } else if (row.type === 'registry') {
            tryInstallSelected()
          } else if (row.type === 'available') {
            const avail = (row.detail as { kind: 'available'; entry: AvailableDetail }).entry
            flashMsg(`copy & run: ${avail.installHint}`, 3000)
          }
          break
        }
        case 's':
          aggregateSkills = !aggregateSkills
          refreshList()
          statusMsg = `aggregate skills: ${aggregateSkills ? 'on' : 'off'}`
          setTimeout(() => {
            statusMsg = ''
            renderer.schedulePaint()
          }, 1500)
          break
        case 'i':
          tryInstallSelected()
          break
      }
      renderer.schedulePaint()
    },

    onMouse: (e) => {
      if (e.action !== 'press') return
      if (helpVisible) {
        helpVisible = false
        renderer.schedulePaint()
        return
      }
      const size = { w: process.stdout.columns || 80, h: process.stdout.rows || 24 }
      if (e.y === 1) {
        const idx = tabHitTest(tabs, tabCounts, e.x)
        if (idx !== null) {
          tabs.selected = idx
          search.value = ''
          refreshList()
          renderer.schedulePaint()
        }
        return
      }
      if (e.y === 3) {
        search.active = true
        renderer.schedulePaint()
        return
      }
      const leftWidth = Math.max(30, Math.floor(size.w * 0.48))
      const lb = box(0, 5, leftWidth, size.h - 6)
      const hit = listHitTest(list, lb, e.x, e.y)
      if (hit !== null) {
        list.selectedIndex = hit
        renderer.schedulePaint()
      }
    },
  })

  renderer.mount()
}

interface RowDataInternal extends RowData {
  label?: string
  description?: string
  hint?: string
}

function oneLine(s: string | undefined): string | undefined {
  if (!s) return s
  const first = s.split('\n')[0]?.trim() ?? ''
  return first || undefined
}
