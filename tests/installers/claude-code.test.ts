import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { claudeCodeInstaller } from '../../src/installers/agents/claude-code.js'
import type { RegistryItem } from '../../src/registry/types.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), 'addx-test-'))
})

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true })
})

const httpItem: RegistryItem = {
  id: 'context7',
  name: 'Context7',
  description: 'Docs MCP',
  type: 'mcp',
  targets: ['claude-code'],
  transport: { type: 'http', url: 'https://mcp.context7.com/mcp' },
}

describe('installers/claude-code', () => {
  test('install writes mcpServers entry', async () => {
    const written = await claudeCodeInstaller.install(httpItem, { scope: 'project', cwd: tmp, env: {} })
    expect(written).toBe(path.join(tmp, '.mcp.json'))

    const raw = JSON.parse(await readFile(written, 'utf8'))
    expect(raw.mcpServers.context7.url).toBe('https://mcp.context7.com/mcp')
    expect(raw.mcpServers.context7.type).toBe('http')
  })

  test('list returns installed item', async () => {
    await claudeCodeInstaller.install(httpItem, { scope: 'project', cwd: tmp, env: {} })
    const items = await claudeCodeInstaller.list('project', tmp)
    expect(items.length).toBe(1)
    expect(items[0]?.id).toBe('context7')
  })

  test('remove deletes the entry', async () => {
    await claudeCodeInstaller.install(httpItem, { scope: 'project', cwd: tmp, env: {} })
    await claudeCodeInstaller.remove('context7', 'project', tmp)
    const items = await claudeCodeInstaller.list('project', tmp)
    expect(items.length).toBe(0)
  })
})
