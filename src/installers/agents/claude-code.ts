// Writes MCP servers into Claude Code's .mcp.json (project) or ~/.claude.json (global).
// Same `mcpServers` JSON shape as the other JSON agents — delegates to the shared helper.

import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const claudeCodeInstaller: Installer = {
  id: 'claude-code',
  name: 'Claude Code',
  detect: (scope, cwd) => detectJsonAgent('claude-code', scope, cwd),
  install: (item, ctx) => installJsonAgent('claude-code', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('claude-code', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('claude-code', scope, cwd),
}
