// Platform detection — OS and architecture primitives used across the codebase.

import { homedir } from 'node:os'
import path from 'node:path'

export type OS = 'mac' | 'linux' | 'windows'
export type Arch = 'x64' | 'arm64' | 'unknown'

export const isMac = process.platform === 'darwin'
export const isLinux = process.platform === 'linux'
export const isWindows = process.platform === 'win32'

export const platform: OS = isMac ? 'mac' : isWindows ? 'windows' : 'linux'

export const arch: Arch =
  process.arch === 'x64' ? 'x64' : process.arch === 'arm64' ? 'arm64' : 'unknown'

export const HOME = process.env.HOME ?? process.env.USERPROFILE ?? homedir()

export const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME ?? path.join(HOME, '.config')

export const APPDATA = process.env.APPDATA ?? path.join(HOME, 'AppData', 'Roaming')

export const MAC_APP_SUPPORT = path.join(HOME, 'Library', 'Application Support')
