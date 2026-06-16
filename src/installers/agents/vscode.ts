import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const vscodeInstaller: Installer = {
  id: 'vscode',
  name: 'VSCode (GitHub Copilot)',
  detect: (scope, cwd) => detectJsonAgent('vscode', scope, cwd),
  install: (item, ctx) => installJsonAgent('vscode', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('vscode', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('vscode', scope, cwd),
}
