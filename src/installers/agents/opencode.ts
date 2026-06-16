import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const opencodeInstaller: Installer = {
  id: 'opencode',
  name: 'OpenCode',
  detect: (scope, cwd) => detectJsonAgent('opencode', scope, cwd),
  install: (item, ctx) => installJsonAgent('opencode', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('opencode', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('opencode', scope, cwd),
}
