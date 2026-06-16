// Shared types for the installer dispatcher and per-agent installers.

import type { AgentId, Scope } from '../platform/paths.js'
import type { RegistryItem } from '../registry/types.js'

export type { AgentId, Scope }

export interface InstallContext {
  scope: Scope
  cwd: string
  /** User-provided env values keyed by env var name. */
  env: Record<string, string>
}

export interface InstallResult {
  agent: AgentId
  ok: boolean
  configPath: string
  message?: string
  error?: string
}

export interface InstalledItem {
  id: string
  agent: AgentId
  /** Raw shape as stored in the agent config — mostly the transport block. */
  config: unknown
}
