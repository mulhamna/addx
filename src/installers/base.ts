// Installer interface every agent module implements.

import type { AgentId, Scope } from '../platform/paths.js'
import type { RegistryItem } from '../registry/types.js'
import type { InstallContext, InstalledItem } from './types.js'

export interface Installer {
  readonly id: AgentId
  readonly name: string

  /** True if this agent appears installed/configured on the current machine. */
  detect(scope: Scope, cwd?: string): Promise<boolean>

  /** Write the item into the agent's config file. Returns the path written. */
  install(item: RegistryItem, ctx: InstallContext): Promise<string>

  /** Remove the item from the agent's config file. Returns the path written. */
  remove(itemId: string, scope: Scope, cwd?: string): Promise<string>

  /** List items currently installed via this agent's config. */
  list(scope: Scope, cwd?: string): Promise<InstalledItem[]>
}
