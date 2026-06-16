// Codex uses TOML config. Stub — TODO real schema mapping.

import type { Installer } from '../base.js'

export const codexInstaller: Installer = {
  id: 'codex',
  name: 'Codex',
  async detect() {
    return false
  },
  async install() {
    throw new Error('codex installer not yet implemented')
  },
  async remove() {
    throw new Error('codex installer not yet implemented')
  },
  async list() {
    return []
  },
}
