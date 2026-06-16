// Orchestrates all detectors and returns a unified DetectedItem list.

import { detectAvailable } from './available.js'
import { detectMcp } from './mcp.js'
import { detectPlugins } from './plugins.js'
import { detectSkills } from './skills.js'
import type { DetectedItem } from './types.js'

export type { DetectedItem, DetectedKind, DetectedSource } from './types.js'
export { isInstalledSource } from './types.js'

export async function scanAll(cwd: string = process.cwd()): Promise<DetectedItem[]> {
  const [mcp, skills, plugins, available] = await Promise.all([
    detectMcp(cwd),
    detectSkills(cwd),
    detectPlugins(cwd),
    detectAvailable(),
  ])
  return [...mcp, ...skills, ...plugins, ...available]
}
