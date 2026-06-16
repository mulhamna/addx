// Registry schema — mirrors the shape documented in CLAUDE.md and CONTRIBUTING.md.

import type { AgentId } from '../platform/paths.js'

export type ItemType = 'mcp' | 'skill' | 'plugin' | 'prompt' | 'theme'

export interface HttpTransport {
  type: 'http' | 'sse'
  url: string
  headers?: Record<string, string>
}

export interface StdioTransport {
  type: 'stdio'
  command: string
  args?: string[]
  env?: Record<string, string>
}

export type Transport = HttpTransport | StdioTransport

export interface EnvVar {
  key: string
  description: string
  required?: boolean
  default?: string
}

export interface RegistryItem {
  id: string
  name: string
  description: string
  type: ItemType
  author?: string
  repo?: string
  homepage?: string
  tags?: string[]
  transport?: Transport
  /** Agent IDs, or ["*"] for all supported agents. */
  targets: (AgentId | '*')[]
  env?: EnvVar[]
  skillTarget?: string
}

export interface Registry {
  version: number
  items: RegistryItem[]
}
