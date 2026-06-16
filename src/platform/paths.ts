// Single source of truth for every agent config file path, per platform and scope.

import path from 'node:path'
import { APPDATA, HOME, MAC_APP_SUPPORT, XDG_CONFIG_HOME, isMac, isWindows } from './index.js'

export type AgentId =
  | 'claude-code'
  | 'claude-desktop'
  | 'cursor'
  | 'vscode'
  | 'windsurf'
  | 'zed'
  | 'opencode'
  | 'gemini-cli'
  | 'cline'
  | 'goose'
  | 'codex'

export type Scope = 'project' | 'global'

export interface ConfigPath {
  /** Absolute path to the config file. */
  path: string
  /** File format. */
  format: 'json' | 'toml' | 'yaml'
}

/** Project-scope paths — written to current working directory. */
function projectPath(agent: AgentId, cwd: string): ConfigPath {
  switch (agent) {
    case 'claude-code':
      return { path: path.join(cwd, '.mcp.json'), format: 'json' }
    case 'cursor':
      return { path: path.join(cwd, '.cursor', 'mcp.json'), format: 'json' }
    case 'vscode':
      return { path: path.join(cwd, '.vscode', 'mcp.json'), format: 'json' }
    case 'opencode':
      return { path: path.join(cwd, 'opencode.json'), format: 'json' }
    case 'gemini-cli':
      return { path: path.join(cwd, '.gemini', 'settings.json'), format: 'json' }
    case 'zed':
      return { path: path.join(cwd, '.zed', 'settings.json'), format: 'json' }
    case 'codex':
      return { path: path.join(cwd, '.codex', 'config.toml'), format: 'toml' }
    case 'claude-desktop':
    case 'windsurf':
    case 'cline':
    case 'goose':
      throw new Error(`Agent ${agent} does not support project scope`)
  }
}

/** Global-scope paths — written to user home. */
function globalPath(agent: AgentId): ConfigPath {
  switch (agent) {
    case 'claude-code':
      return { path: path.join(HOME, '.claude.json'), format: 'json' }

    case 'claude-desktop':
      if (isMac) {
        return {
          path: path.join(MAC_APP_SUPPORT, 'Claude', 'claude_desktop_config.json'),
          format: 'json',
        }
      }
      if (isWindows) {
        return { path: path.join(APPDATA, 'Claude', 'claude_desktop_config.json'), format: 'json' }
      }
      return {
        path: path.join(XDG_CONFIG_HOME, 'Claude', 'claude_desktop_config.json'),
        format: 'json',
      }

    case 'cursor':
      if (isWindows) return { path: path.join(APPDATA, 'Cursor', 'mcp.json'), format: 'json' }
      return { path: path.join(HOME, '.cursor', 'mcp.json'), format: 'json' }

    case 'vscode':
      if (isMac) {
        return { path: path.join(MAC_APP_SUPPORT, 'Code', 'User', 'mcp.json'), format: 'json' }
      }
      if (isWindows) {
        return { path: path.join(APPDATA, 'Code', 'User', 'mcp.json'), format: 'json' }
      }
      return { path: path.join(XDG_CONFIG_HOME, 'Code', 'User', 'mcp.json'), format: 'json' }

    case 'windsurf':
      if (isWindows) {
        return {
          path: path.join(APPDATA, 'Codeium', 'windsurf', 'mcp_config.json'),
          format: 'json',
        }
      }
      return {
        path: path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json'),
        format: 'json',
      }

    case 'zed':
      if (isMac) {
        return { path: path.join(MAC_APP_SUPPORT, 'Zed', 'settings.json'), format: 'json' }
      }
      if (isWindows) return { path: path.join(APPDATA, 'Zed', 'settings.json'), format: 'json' }
      return { path: path.join(XDG_CONFIG_HOME, 'zed', 'settings.json'), format: 'json' }

    case 'cline': {
      const tail = path.join(
        'Code',
        'User',
        'globalStorage',
        'saoudrizwan.claude-dev',
        'settings',
        'cline_mcp_settings.json',
      )
      if (isMac) return { path: path.join(MAC_APP_SUPPORT, tail), format: 'json' }
      if (isWindows) return { path: path.join(APPDATA, tail), format: 'json' }
      return { path: path.join(XDG_CONFIG_HOME, tail), format: 'json' }
    }

    case 'goose':
      if (isWindows) return { path: path.join(APPDATA, 'goose', 'config.yaml'), format: 'yaml' }
      return { path: path.join(XDG_CONFIG_HOME, 'goose', 'config.yaml'), format: 'yaml' }

    case 'gemini-cli':
      if (isWindows) return { path: path.join(APPDATA, 'gemini', 'settings.json'), format: 'json' }
      return { path: path.join(HOME, '.gemini', 'settings.json'), format: 'json' }

    case 'opencode':
      if (isWindows) {
        return { path: path.join(APPDATA, 'opencode', 'opencode.json'), format: 'json' }
      }
      return { path: path.join(XDG_CONFIG_HOME, 'opencode', 'opencode.json'), format: 'json' }

    case 'codex':
      return { path: path.join(HOME, '.codex', 'config.toml'), format: 'toml' }
  }
}

export function getAgentConfigPath(
  agent: AgentId,
  scope: Scope,
  cwd: string = process.cwd(),
): ConfigPath {
  return scope === 'project' ? projectPath(agent, cwd) : globalPath(agent)
}

export const ALL_AGENTS: readonly AgentId[] = [
  'claude-code',
  'claude-desktop',
  'cursor',
  'vscode',
  'windsurf',
  'zed',
  'opencode',
  'gemini-cli',
  'cline',
  'goose',
  'codex',
] as const

/** Location of addx's own state file — records what we installed. */
export function getStateFilePath(): string {
  return path.join(HOME, '.addx', 'state.json')
}

/** Agents that support project-scope installs (have a per-repo config file). */
export const PROJECT_SCOPE_AGENTS: readonly AgentId[] = [
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'gemini-cli',
  'zed',
  'codex',
] as const
