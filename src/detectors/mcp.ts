// Wrap existing Installer.list() outputs as DetectedItem for unified TUI display.

import { INSTALLERS } from '../installers/index.js'
import type { AgentId, Scope } from '../platform/paths.js'
import { getAgentConfigPath } from '../platform/paths.js'
import type { DetectedItem } from './types.js'

export async function detectMcp(cwd: string = process.cwd()): Promise<DetectedItem[]> {
  const out: DetectedItem[] = []
  const seen = new Set<string>()
  for (const scope of ['project', 'global'] as const) {
    for (const [agentIdStr, installer] of Object.entries(INSTALLERS)) {
      const agent = agentIdStr as AgentId
      let items: Awaited<ReturnType<typeof installer.list>> = []
      try {
        items = await installer.list(scope as Scope, cwd)
      } catch {
        continue
      }
      let configPath = ''
      try {
        configPath = getAgentConfigPath(agent, scope as Scope, cwd).path
      } catch {
        // agent doesn't support this scope — skip
        continue
      }
      for (const it of items) {
        const key = `${it.id}::${agent}::${scope}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          id: it.id,
          kind: 'mcp',
          name: it.id,
          source: { type: 'agent-config', agent, scope: scope as Scope, configPath },
          rawConfig: it.config,
        })
      }
    }
  }
  return out
}
