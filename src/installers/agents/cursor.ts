import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const cursorInstaller: Installer = {
  id: 'cursor',
  name: 'Cursor',
  detect: (scope, cwd) => detectJsonAgent('cursor', scope, cwd),
  install: (item, ctx) => installJsonAgent('cursor', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('cursor', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('cursor', scope, cwd),
}
