import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const clineInstaller: Installer = {
  id: 'cline',
  name: 'Cline (VSCode)',
  detect: (scope, cwd) => detectJsonAgent('cline', scope, cwd),
  install: (item, ctx) => installJsonAgent('cline', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('cline', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('cline', scope, cwd),
}
