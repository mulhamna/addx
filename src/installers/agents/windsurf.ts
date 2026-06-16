import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const windsurfInstaller: Installer = {
  id: 'windsurf',
  name: 'Windsurf',
  detect: (scope, cwd) => detectJsonAgent('windsurf', scope, cwd),
  install: (item, ctx) => installJsonAgent('windsurf', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('windsurf', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('windsurf', scope, cwd),
}
