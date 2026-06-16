import { describe, expect, test } from 'bun:test'
import { ALL_AGENTS, getAgentConfigPath } from '../src/platform/paths.js'

describe('platform/paths', () => {
  test('all agents resolve to a global config path', () => {
    for (const agent of ALL_AGENTS) {
      const cp = getAgentConfigPath(agent, 'global')
      expect(cp.path.length).toBeGreaterThan(0)
      expect(['json', 'toml', 'yaml']).toContain(cp.format)
    }
  })

  test('project scope resolves to cwd-prefixed path for supported agents', () => {
    const cp = getAgentConfigPath('claude-code', 'project', '/tmp/foo')
    expect(cp.path).toBe('/tmp/foo/.mcp.json')
    expect(cp.format).toBe('json')
  })

  test('claude-desktop has no project scope', () => {
    expect(() => getAgentConfigPath('claude-desktop', 'project', '/tmp/foo')).toThrow()
  })
})
