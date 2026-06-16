// Zed stores settings in JSON but uses a `context_servers` key, not `mcpServers`. Stubbed for now.

import { existsSync } from 'node:fs'
import { readJson, writeJson } from '../../platform/fs.js'
import { getAgentConfigPath } from '../../platform/paths.js'
import type { Installer } from '../base.js'
import type { InstalledItem } from '../types.js'

interface ZedSettings {
  context_servers?: Record<string, unknown>
  [key: string]: unknown
}

export const zedInstaller: Installer = {
  id: 'zed',
  name: 'Zed',

  async detect(scope, cwd = process.cwd()) {
    return existsSync(getAgentConfigPath('zed', scope, cwd).path)
  },

  async install(item, ctx): Promise<string> {
    if (item.type !== 'mcp' || !item.transport) {
      throw new Error('zed installer requires type=mcp with transport')
    }
    const { path } = getAgentConfigPath('zed', ctx.scope, ctx.cwd)
    const existing = (await readJson<ZedSettings>(path)) ?? {}
    existing.context_servers = existing.context_servers ?? {}
    existing.context_servers[item.id] =
      item.transport.type === 'stdio'
        ? { command: { path: item.transport.command, args: item.transport.args ?? [] } }
        : { url: item.transport.url, type: item.transport.type }
    await writeJson(path, existing)
    return path
  },

  async remove(itemId, scope, cwd = process.cwd()): Promise<string> {
    const { path } = getAgentConfigPath('zed', scope, cwd)
    const existing = (await readJson<ZedSettings>(path)) ?? {}
    if (existing.context_servers?.[itemId]) {
      delete existing.context_servers[itemId]
      await writeJson(path, existing)
    }
    return path
  },

  async list(scope, cwd = process.cwd()): Promise<InstalledItem[]> {
    const { path } = getAgentConfigPath('zed', scope, cwd)
    const existing = await readJson<ZedSettings>(path)
    if (!existing?.context_servers) return []
    return Object.entries(existing.context_servers).map(([id, config]) => ({
      id,
      agent: 'zed',
      config,
    }))
  },
}
