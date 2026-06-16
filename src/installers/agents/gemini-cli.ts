import type { Installer } from '../base.js'
import {
  detectJsonAgent,
  installJsonAgent,
  listJsonAgent,
  removeJsonAgent,
} from './_shared-mcp-json.js'

export const geminiCliInstaller: Installer = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  detect: (scope, cwd) => detectJsonAgent('gemini-cli', scope, cwd),
  install: (item, ctx) => installJsonAgent('gemini-cli', item, ctx),
  remove: (id, scope, cwd) => removeJsonAgent('gemini-cli', id, scope, cwd),
  list: (scope, cwd) => listJsonAgent('gemini-cli', scope, cwd),
}
