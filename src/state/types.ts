// State tracking schema: records which items addx installed where, so the TUI can distinguish
// "managed by addx" from "found in agent config but installed manually".

import type { AgentId, Scope } from '../platform/paths.js'

export interface InstallRecord {
  id: string
  agent: AgentId
  scope: Scope
  installedAt: string
}

export interface InstallState {
  version: 1
  installs: InstallRecord[]
}

export const EMPTY_STATE: InstallState = { version: 1, installs: [] }
