import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const claudeDesktopInstaller: Installer = {
  id: 'claude-desktop',
  name: 'Claude Desktop',
  detect: (scope, cwd) => detectJsonAgent('claude-desktop', scope, cwd),
  install: (item, ctx) => installJsonAgent('claude-desktop', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('claude-desktop', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('claude-desktop', scope, cwd),
}
