// Reference implementation: writes MCP servers into Claude Code's .mcp.json (project) or ~/.claude.json (global).

import { existsSync } from 'node:fs'
import { readJson, writeJson } from '../../platform/fs.js'
import { getAgentConfigPath } from '../../platform/paths.js'
import type { Scope } from '../../platform/paths.js'
import type { RegistryItem, Transport } from '../../registry/types.js'
import type { Installer } from '../base.js'
import type { InstallContext, InstalledItem } from '../types.js'

interface McpServerEntry {
  type?: 'http' | 'sse' | 'stdio'
  url?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  headers?: Record<string, string>
}

interface McpJson {
  mcpServers?: Record<string, McpServerEntry>
  [key: string]: unknown
}

function toServerEntry(transport: Transport, env: Record<string, string>): McpServerEntry {
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

export const claudeCodeInstaller: Installer = {
  id: 'claude-code',
  name: 'Claude Code',

  async detect(scope, cwd = process.cwd()) {
    const { path } = getAgentConfigPath('claude-code', scope, cwd)
    return existsSync(path)
  },

  async install(item: RegistryItem, ctx: InstallContext): Promise<string> {
    if (item.type !== 'mcp' || !item.transport) {
      throw new Error(
        `claude-code installer only supports type=mcp with transport (got ${item.type})`,
      )
    }
    const { path } = getAgentConfigPath('claude-code', ctx.scope, ctx.cwd)
    const existing = (await readJson<McpJson>(path)) ?? {}
    existing.mcpServers = existing.mcpServers ?? {}
    existing.mcpServers[item.id] = toServerEntry(item.transport, ctx.env)
    await writeJson(path, existing)
    return path
  },

  async remove(itemId, scope, cwd = process.cwd()): Promise<string> {
    const { path } = getAgentConfigPath('claude-code', scope, cwd)
    const existing = (await readJson<McpJson>(path)) ?? {}
    if (existing.mcpServers?.[itemId]) {
      delete existing.mcpServers[itemId]
      await writeJson(path, existing)
    }
    return path
  },

  async list(scope, cwd = process.cwd()): Promise<InstalledItem[]> {
    const { path } = getAgentConfigPath('claude-code', scope, cwd)
    const existing = await readJson<McpJson>(path)
    if (!existing?.mcpServers) return []
    return Object.entries(existing.mcpServers).map(([id, config]) => ({
      id,
      agent: 'claude-code',
      config,
    }))
  },
}
