// CLI entrypoint: parses argv, routes to TUI (interactive) or CLI subcommands (non-interactive).

import { detectInstalledAgents, installItem, removeItem } from './installers/index.js'
import type { AgentId, Scope } from './platform/paths.js'
import { ALL_AGENTS } from './platform/paths.js'
import { loadRegistry } from './registry/loader.js'
import { findById, searchItems } from './registry/search.js'
import { launchHome } from './tui/screens/home.js'
import { log, setDebug } from './utils/logger.js'
import { NAME, VERSION } from './utils/version.js'

interface Args {
  command: string | null
  positional: string[]
  flags: Record<string, string | boolean>
  targets: AgentId[]
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}
  const targets: AgentId[] = []
  let command: string | null = null

  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i] ?? ''
    if (tok.startsWith('--')) {
      const eq = tok.indexOf('=')
      if (eq >= 0) {
        flags[tok.slice(2, eq)] = tok.slice(eq + 1)
      } else {
        const name = tok.slice(2)
        const next = argv[i + 1]
        if (name === 'target' && next) {
          targets.push(next as AgentId)
          i++
        } else if (next && !next.startsWith('-')) {
          flags[name] = next
          i++
        } else {
          flags[name] = true
        }
      }
    } else if (tok.startsWith('-') && tok.length > 1) {
      const short = tok.slice(1)
      if (short === 'g') flags.global = true
      else if (short === 'h') flags.help = true
      else if (short === 'v') flags.version = true
      else if (short === 't' && argv[i + 1]) {
        targets.push(argv[++i] as AgentId)
      } else {
        flags[short] = true
      }
    } else if (command === null) {
      command = tok
    } else {
      positional.push(tok)
    }
  }
  return { command, positional, flags, targets }
}

function printVersion(): void {
  process.stdout.write(`${NAME} ${VERSION}\n`)
}

function printHelp(): void {
  process.stdout.write(`${NAME} v${VERSION} — the universal AI tools manager.

USAGE
  addx                                Launch the interactive TUI
  addx install <id> [flags]           Install a registry item
  addx remove <id> [flags]            Remove an installed item
  addx list [flags]                   List installed items
  addx search <query>                 Search the registry
  addx info <id>                      Show item details

FLAGS
  --target <agent>, -t <agent>        Install/remove target (repeatable)
  --global, -g                        Global scope (default: project)
  --debug                             Verbose logging
  --version, -v                       Print version
  --help, -h                          Show this help

AGENTS
  ${ALL_AGENTS.join(', ')}
`)
}

async function runInstall(args: Args): Promise<number> {
  const id = (args.positional[0] ?? args.command === 'install') ? args.positional[0] : null
  const itemId = args.command === 'install' ? args.positional[0] : id
  if (!itemId) {
    log.error('install requires an item id (e.g. addx install context7 -t cursor)')
    return 2
  }
  const registry = loadRegistry()
  const item = findById(itemId, registry.items)
  if (!item) {
    log.error(`item not found in registry: ${itemId}`)
    return 1
  }
  const scope: Scope = args.flags.global ? 'global' : 'project'
  const targets =
    args.targets.length > 0 ? args.targets : await detectInstalledAgents(scope, process.cwd())
  if (targets.length === 0) {
    log.error('no targets specified and no agents auto-detected. Use --target <agent>.')
    return 2
  }
  const env: Record<string, string> = {}
  for (const v of item.env ?? []) {
    const envVal = process.env[v.key]
    if (envVal) env[v.key] = envVal
    else if (v.required) {
      log.error(`env var required: ${v.key} (${v.description})`)
      return 2
    }
  }
  const results = await installItem(item, targets, { scope, cwd: process.cwd(), env })
  let failed = 0
  for (const r of results) {
    if (r.ok) process.stdout.write(`✓ ${r.agent}: ${r.configPath}\n`)
    else {
      process.stdout.write(`✗ ${r.agent}: ${r.error}\n`)
      failed++
    }
  }
  return failed === 0 ? 0 : 1
}

async function runRemove(args: Args): Promise<number> {
  const itemId = args.positional[0]
  if (!itemId) {
    log.error('remove requires an item id')
    return 2
  }
  const scope: Scope = args.flags.global ? 'global' : 'project'
  const targets = args.targets.length > 0 ? args.targets : (ALL_AGENTS as AgentId[]).slice()
  const results = await removeItem(itemId, targets, { scope, cwd: process.cwd() })
  for (const r of results) {
    if (r.ok) process.stdout.write(`✓ ${r.agent}: ${r.configPath}\n`)
    else process.stdout.write(`✗ ${r.agent}: ${r.error}\n`)
  }
  return 0
}

async function runList(args: Args): Promise<number> {
  const scope: Scope = args.flags.global ? 'global' : 'project'
  const { INSTALLERS } = await import('./installers/index.js')
  let count = 0
  for (const [agent, installer] of Object.entries(INSTALLERS)) {
    try {
      const items = await installer.list(scope, process.cwd())
      for (const it of items) {
        process.stdout.write(`${agent}\t${it.id}\n`)
        count++
      }
    } catch {
      // ignore agents that fail to read
    }
  }
  if (count === 0) process.stdout.write('(no items installed)\n')
  return 0
}

function runSearch(args: Args): number {
  const q = args.positional.join(' ')
  if (!q) {
    log.error('search requires a query')
    return 2
  }
  const registry = loadRegistry()
  const results = searchItems(q, registry.items)
  if (results.length === 0) {
    process.stdout.write('(no matches)\n')
    return 0
  }
  for (const r of results) {
    process.stdout.write(`${r.item.id}\t${r.item.type}\t${r.item.name}\n`)
  }
  return 0
}

function runInfo(args: Args): number {
  const id = args.positional[0]
  if (!id) {
    log.error('info requires an item id')
    return 2
  }
  const item = findById(id, loadRegistry().items)
  if (!item) {
    log.error(`not found: ${id}`)
    return 1
  }
  process.stdout.write(`${JSON.stringify(item, null, 2)}\n`)
  return 0
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.flags.debug) setDebug(true)
  if (args.flags.version) return void printVersion()
  if (args.flags.help) return void printHelp()

  const isTty = Boolean(process.stdout.isTTY)
  if (args.command === null) {
    if (isTty) {
      await launchHome()
      return
    }
    printHelp()
    return
  }

  let code = 0
  switch (args.command) {
    case 'install':
      code = await runInstall(args)
      break
    case 'remove':
    case 'uninstall':
      code = await runRemove(args)
      break
    case 'list':
    case 'ls':
      code = await runList(args)
      break
    case 'search':
      code = runSearch(args)
      break
    case 'info':
      code = runInfo(args)
      break
    case 'help':
      printHelp()
      break
    default:
      log.error(`unknown command: ${args.command}`)
      printHelp()
      code = 2
  }
  if (code !== 0) process.exit(code)
}

main().catch((err) => {
  log.error(err)
  process.exit(1)
})
