// Read/write addx's install state file (~/.addx/state.json).

import { readJson, writeJson } from '../platform/fs.js'
import type { AgentId, Scope } from '../platform/paths.js'
import { getStateFilePath } from '../platform/paths.js'
import { EMPTY_STATE, type InstallRecord, type InstallState } from './types.js'

export async function loadState(): Promise<InstallState> {
  const data = await readJson<InstallState>(getStateFilePath())
  if (!data || data.version !== 1 || !Array.isArray(data.installs)) {
    return { ...EMPTY_STATE }
  }
  return data
}

export async function saveState(state: InstallState): Promise<void> {
  await writeJson(getStateFilePath(), state)
}

export async function recordInstall(id: string, agent: AgentId, scope: Scope): Promise<void> {
  const state = await loadState()
  const filtered = state.installs.filter(
    (r) => !(r.id === id && r.agent === agent && r.scope === scope),
  )
  const next: InstallRecord = {
    id,
    agent,
    scope,
    installedAt: new Date().toISOString(),
  }
  await saveState({ version: 1, installs: [...filtered, next] })
}

export async function recordRemove(id: string, agent: AgentId, scope: Scope): Promise<void> {
  const state = await loadState()
  await saveState({
    version: 1,
    installs: state.installs.filter(
      (r) => !(r.id === id && r.agent === agent && r.scope === scope),
    ),
  })
}

export function isAddxManaged(
  state: InstallState,
  id: string,
  agent: AgentId,
  scope: Scope,
): boolean {
  return state.installs.some((r) => r.id === id && r.agent === agent && r.scope === scope)
}
