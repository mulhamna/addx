// Helper for agents that store MCP servers under a `mcpServers` key in a JSON config (Cursor, VSCode, Claude Desktop, Windsurf, Cline).

import { existsSync } from 'node:fs'
import { readJson, writeJson } from '../../platform/fs.js'
import { getAgentConfigPath } from '../../platform/paths.js'
import type { AgentId, Scope } from '../../platform/paths.js'
import type { RegistryItem, Transport } from '../../registry/types.js'
import type { InstallContext, InstalledItem } from '../types.js'

interface ServerEntry {
  type?: 'http' | 'sse' | 'stdio'
  url?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  headers?: Record<string, string>
}

interface McpJson {
  mcpServers?: Record<string, ServerEntry>
  [key: string]: unknown
}

function toEntry(transport: Transport, env: Record<string, string>): ServerEntry {
  if (transport.type === 'stdio') {
    return {
      type: 'stdio',
      command: transport.command,
      args: transport.args ?? [],
      env: { ...(transport.env ?? {}), ...env },
    }
  }
  return {
    type: transport.type,
    url: transport.url,
    ...(transport.headers ? { headers: transport.headers } : {}),
  }
}

export async function detectJsonAgent(
  agent: AgentId,
  scope: Scope,
  cwd = process.cwd(),
): Promise<boolean> {
  return existsSync(getAgentConfigPath(agent, scope, cwd).path)
}

export async function installJsonAgent(
  agent: AgentId,
  item: RegistryItem,
  ctx: InstallContext,
): Promise<string> {
  if (item.type !== 'mcp' || !item.transport) {
    throw new Error(`${agent} installer requires type=mcp with transport`)
  }
  const { path } = getAgentConfigPath(agent, ctx.scope, ctx.cwd)
  const existing = (await readJson<McpJson>(path)) ?? {}
  existing.mcpServers = existing.mcpServers ?? {}
  existing.mcpServers[item.id] = toEntry(item.transport, ctx.env)
  await writeJson(path, existing)
  return path
}

export async function removeJsonAgent(
  agent: AgentId,
  itemId: string,
  scope: Scope,
  cwd = process.cwd(),
): Promise<string> {
  const { path } = getAgentConfigPath(agent, scope, cwd)
  const existing = (await readJson<McpJson>(path)) ?? {}
  if (existing.mcpServers?.[itemId]) {
    delete existing.mcpServers[itemId]
    await writeJson(path, existing)
  }
  return path
}

export async function listJsonAgent(
  agent: AgentId,
  scope: Scope,
  cwd = process.cwd(),
): Promise<InstalledItem[]> {
  const { path } = getAgentConfigPath(agent, scope, cwd)
  const existing = await readJson<McpJson>(path)
  if (!existing?.mcpServers) return []
  return Object.entries(existing.mcpServers).map(([id, config]) => ({ id, agent, config }))
}
