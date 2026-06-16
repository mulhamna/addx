// Goose uses YAML config. Stub — TODO real schema mapping.

import type { Installer } from '../base.js'

export const gooseInstaller: Installer = {
  id: 'goose',
  name: 'Goose',
  async detect() {
    return false
  },
  async install() {
    throw new Error('goose installer not yet implemented')
  },
  async remove() {
    throw new Error('goose installer not yet implemented')
  },
  async list() {
    return []
  },
}
