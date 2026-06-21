// Dispatcher: maps AgentId → Installer and exposes batch install helpers.

import type { AgentId } from '../platform/paths.js'
import type { RegistryItem } from '../registry/types.js'
import type { Installer } from './base.js'
import type { InstallContext, InstallResult } from './types.js'

import { recordInstall, recordRemove } from '../state/store.js'
import { claudeCodeInstaller } from './agents/claude-code.js'
import { claudeDesktopInstaller } from './agents/claude-desktop.js'
import { clineInstaller } from './agents/cline.js'
import { cursorInstaller } from './agents/cursor.js'
import { geminiCliInstaller } from './agents/gemini-cli.js'
import { opencodeInstaller } from './agents/opencode.js'
import { vscodeInstaller } from './agents/vscode.js'
import { windsurfInstaller } from './agents/windsurf.js'
import { zedInstaller } from './agents/zed.js'

export const INSTALLERS: Record<AgentId, Installer> = {
  'claude-code': claudeCodeInstaller,
  'claude-desktop': claudeDesktopInstaller,
  cursor: cursorInstaller,
  vscode: vscodeInstaller,
  windsurf: windsurfInstaller,
  zed: zedInstaller,
  opencode: opencodeInstaller,
  'gemini-cli': geminiCliInstaller,
  cline: clineInstaller,
}

export function getInstaller(agent: AgentId): Installer {
  const inst = INSTALLERS[agent]
  if (!inst) throw new Error(`Unknown agent: ${agent}`)
  return inst
}

export async function installItem(
  item: RegistryItem,
  targets: AgentId[],
  ctx: InstallContext,
): Promise<InstallResult[]> {
  const results: InstallResult[] = []
  for (const agent of targets) {
    const installer = INSTALLERS[agent]
    if (!installer) {
      results.push({ agent, ok: false, configPath: '', error: `unknown agent: ${agent}` })
      continue
    }
    try {
      const p = await installer.install(item, ctx)
      await recordInstall(item.id, agent, ctx.scope)
      results.push({ agent, ok: true, configPath: p })
    } catch (e) {
      results.push({
        agent,
        ok: false,
        configPath: '',
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return results
}

export async function removeItem(
  itemId: string,
  targets: AgentId[],
  ctx: { scope: InstallContext['scope']; cwd: string },
): Promise<InstallResult[]> {
  const results: InstallResult[] = []
  for (const agent of targets) {
    const installer = INSTALLERS[agent]
    if (!installer) continue
    try {
      const p = await installer.remove(itemId, ctx.scope, ctx.cwd)
      await recordRemove(itemId, agent, ctx.scope)
      results.push({ agent, ok: true, configPath: p })
    } catch (e) {
      results.push({
        agent,
        ok: false,
        configPath: '',
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return results
}

export async function detectInstalledAgents(
  scope: InstallContext['scope'],
  cwd: string,
): Promise<AgentId[]> {
  const detected: AgentId[] = []
  for (const [id, installer] of Object.entries(INSTALLERS)) {
    try {
      if (await installer.detect(scope, cwd)) detected.push(id as AgentId)
    } catch {
      // ignore detection failures
    }
  }
  return detected
}
