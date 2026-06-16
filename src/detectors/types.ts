// Shape for an item detected on the user's filesystem (MCP, skill, or plugin).

import type { AgentId, Scope } from '../platform/paths.js'

export type DetectedKind = 'mcp' | 'skill' | 'plugin'

export type DetectedSource =
  | { type: 'agent-config'; agent: AgentId; scope: Scope; configPath: string }
  | { type: 'filesystem'; agent: AgentId; scope: Scope; path: string }
  | {
      type: 'marketplace'
      agent: AgentId
      marketplace: string
      pluginName: string
      installHint: string
      category?: string
      author?: string
      homepage?: string
    }

export interface DetectedItem {
  id: string
  kind: DetectedKind
  name: string
  description?: string
  source: DetectedSource
  rawConfig?: unknown
}

export function isInstalledSource(s: DetectedSource): boolean {
  return s.type === 'agent-config' || s.type === 'filesystem'
}
