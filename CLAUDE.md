# CLAUDE.md — addx

This file provides full context for AI coding agents (Claude Code, Cursor, etc.) working on the `addx` project. Read this entire file before making any changes.

---

## Project Overview

**addx** is a universal AI tooling manager with a mouse-clickable TUI (Terminal User Interface). It allows developers to browse, install, and manage MCP servers, skills, plugins, and other AI tooling across multiple AI coding agents and applications — from a single interactive terminal interface.

It is distributed via npm (`npx addx`) and requires no additional runtime from the user. The TUI is inspired by opencode's terminal UI aesthetic: clean, minimal, keyboard + mouse navigable.

**Tagline:** `npx addx` — the universal AI tools manager.

---

## Goals & Non-Goals

### Goals
- Beautiful, mouse-clickable TUI that feels native to the terminal
- Support installing MCP servers, skills, plugins, and future extensible types
- Support all major AI agents and tools as install targets
- Work identically on Mac (x86 + ARM), Linux (x86 + ARM), Windows (x86 + ARM)
- Community-driven registry via curated `registry.json` in the repo (no hosted backend)
- Both project-level and global installs, user's choice
- Zero runtime dependencies for the end user (ships as a bundled JS file)

### Non-Goals
- No hosted API or backend — registry is a flat JSON file in the repo
- No GUI / Electron app — terminal only
- Not a replacement for package managers (npm, pip, etc.) — it's a config bridge
- Not an AI agent itself — it configures agents, not runs them

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Language | TypeScript | Type safety, great DX, npm-native |
| Runtime (dev) | Bun | Fast startup, native TS, no build config needed |
| Runtime (user) | Node.js | User needs zero extra installs; bundle is plain JS |
| Bundler | Bun (`bun build`) | Single-file output, tree-shaking, fast |
| TUI | Custom terminal renderer | Full control over layout, mouse, styling — inspired by opencode |
| Terminal primitives | `@isaacs/cliui` + raw ANSI / direct stdout writes | Lightweight, no heavy framework |
| Mouse support | Raw terminal mouse protocol (enable via `\x1b[?1000h`) | Works across platforms |
| Config parsing | Built-in (JSON, TOML via `smol-toml`) | Handle various agent config formats |
| Registry | `registry.json` in repo root | Flat file, community PR-able |
| Testing | `bun test` | Native, fast |
| Linting | Biome | Fast, opinionated, replaces ESLint + Prettier |

---

## Distribution

```
Dev writes TypeScript
      ↓
Bun bundles → dist/addx.js  (single file, plain CJS/ESM)
      ↓
npm publish  (ships dist/addx.js + package.json)
      ↓
User runs: npx addx
Node.js executes dist/addx.js — no Bun, no TS compiler needed
```

The user **never needs Bun, TypeScript, or any compiler.** `npx addx` just works.

---

## Repository Structure

```
addx/
├── src/
│   ├── index.ts                  # Entry point, CLI arg parsing, launches TUI or runs command
│   ├── tui/
│   │   ├── renderer.ts           # Core terminal renderer (write to stdout, handle resize)
│   │   ├── mouse.ts              # Mouse event capture and routing
│   │   ├── keyboard.ts           # Keyboard event handling
│   │   ├── layout.ts             # Layout engine (rows, columns, panels)
│   │   ├── components/
│   │   │   ├── list.ts           # Scrollable, clickable list component
│   │   │   ├── searchbar.ts      # Search input component
│   │   │   ├── detail.ts         # Right panel: item detail view
│   │   │   ├── statusbar.ts      # Bottom status bar
│   │   │   ├── modal.ts          # Confirmation / input modals
│   │   │   ├── tabs.ts           # Type filter tabs (MCP / Skills / Plugins / All)
│   │   │   └── checkbox.ts       # Multi-select checkboxes for install targets
│   │   └── screens/
│   │       ├── home.ts           # Main browse screen
│   │       ├── install.ts        # Install flow screen
│   │       ├── installed.ts      # Manage installed items screen
│   │       └── settings.ts       # Settings screen
│   ├── registry/
│   │   ├── loader.ts             # Load & parse registry.json
│   │   ├── search.ts             # Fuzzy search over registry items
│   │   └── types.ts              # Registry item type definitions
│   ├── installers/
│   │   ├── index.ts              # Installer dispatcher
│   │   ├── base.ts               # Base installer interface
│   │   ├── agents/               # One file per supported agent
│   │   │   ├── claude-code.ts
│   │   │   ├── claude-desktop.ts
│   │   │   ├── cursor.ts
│   │   │   ├── vscode.ts
│   │   │   ├── windsurf.ts
│   │   │   ├── zed.ts
│   │   │   ├── opencode.ts
│   │   │   ├── gemini-cli.ts
│   │   │   ├── cline.ts
│   │   │   └── goose.ts
│   │   └── types.ts              # Installer target type definitions
│   ├── platform/
│   │   ├── index.ts              # Platform detection (mac/linux/windows, arch)
│   │   ├── paths.ts              # All config path resolution per platform
│   │   └── fs.ts                 # Safe file read/write helpers (JSON, TOML, YAML)
│   └── utils/
│       ├── logger.ts             # Structured logger (debug mode behind flag)
│       └── version.ts            # Version info
├── registry.json                 # Community-curated registry (source of truth)
├── package.json
├── tsconfig.json
├── biome.json
├── bunfig.toml
├── CLAUDE.md                     # This file
├── CONTRIBUTING.md               # How to contribute / add to registry
└── README.md
```

---

## Registry Format

`registry.json` is the single source of truth. Community members open PRs to add entries.

```jsonc
{
  "version": 1,
  "items": [
    {
      // Unique identifier, kebab-case
      "id": "context7",

      // Display name
      "name": "Context7",

      // Short description (shown in list)
      "description": "Up-to-date docs for any library, straight into your prompt.",

      // Type determines how it gets installed
      // Allowed: "mcp" | "skill" | "plugin" | "prompt" | "theme"
      "type": "mcp",

      // Author or org
      "author": "upstash",

      // Optional: source repo
      "repo": "https://github.com/upstash/context7-mcp",

      // Tags for search
      "tags": ["docs", "context", "libraries"],

      // Transport config (for type: "mcp")
      // transport.type: "http" | "sse" | "stdio"
      "transport": {
        "type": "http",
        "url": "https://mcp.context7.com/mcp"
      },

      // Which agents this item supports being installed into
      // Special value: ["*"] means all supported agents
      "targets": ["claude-code", "cursor", "vscode", "claude-desktop"],

      // Optional: env vars the user needs to provide
      "env": [
        { "key": "API_KEY", "description": "Your Context7 API key", "required": false }
      ],

      // Optional: for type "skill" — which runtime/app handles it
      "skillTarget": "claude",

      // Optional: homepage or docs
      "homepage": "https://context7.com"
    }
  ]
}
```

### Supported Types

| Type | Description |
|---|---|
| `mcp` | MCP server (HTTP, SSE, or stdio transport) |
| `skill` | Claude skill / system prompt enhancement |
| `plugin` | Editor plugin or extension config |
| `prompt` | Reusable prompt template |
| `theme` | Terminal/editor theme |

Types are extensible — new types can be added to the registry schema without breaking existing installs.

---

## Supported Install Targets (Agents)

Each agent has its own installer in `src/installers/agents/`. The installer knows:
1. How to detect if the agent is installed
2. Where the config file lives (per platform, per scope)
3. How to read and write the config (JSON / TOML / YAML)

### Config Paths

#### Project scope (default) — written to current working directory

| Agent | Path |
|---|---|
| Claude Code | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| VSCode / GitHub Copilot | `.vscode/mcp.json` |
| OpenCode | `opencode.json` |
| Gemini CLI | `.gemini/settings.json` |
| Zed | `.zed/settings.json` |
| Codex | `.codex/config.toml` |

#### Global scope (`--global` flag) — written to user home

| Agent | Mac | Linux | Windows |
|---|---|---|---|
| Claude Code | `~/.claude.json` | `~/.claude.json` | `%USERPROFILE%\.claude.json` |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` | `~/.cursor/mcp.json` | `%APPDATA%\Cursor\mcp.json` |
| VSCode | `~/Library/Application Support/Code/User/mcp.json` | `~/.config/Code/User/mcp.json` | `%APPDATA%\Code\User\mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `~/.codeium/windsurf/mcp_config.json` | `%APPDATA%\Codeium\windsurf\mcp_config.json` |
| Zed | `~/Library/Application Support/Zed/settings.json` | `~/.config/zed/settings.json` | `%APPDATA%\Zed\settings.json` |
| Cline (VSCode ext) | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` |
| Goose | `~/.config/goose/config.yaml` | `~/.config/goose/config.yaml` | `%APPDATA%\goose\config.yaml` |
| Gemini CLI | `~/.gemini/settings.json` | `~/.gemini/settings.json` | `%APPDATA%\gemini\settings.json` |
| OpenCode | `~/.config/opencode/opencode.json` | `~/.config/opencode/opencode.json` | `%APPDATA%\opencode\opencode.json` |

---

## Platform Path Resolution

All path resolution lives in `src/platform/paths.ts`. Rules:

```typescript
// Platform detection
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'

// Home directory
const HOME = process.env.HOME ?? process.env.USERPROFILE ?? ''

// XDG — Linux only, respect if set
const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME ?? path.join(HOME, '.config')

// Windows APPDATA
const APPDATA = process.env.APPDATA ?? path.join(HOME, 'AppData', 'Roaming')

// Mac Application Support
const MAC_APP_SUPPORT = path.join(HOME, 'Library', 'Application Support')
```

Always use these primitives. Never hardcode paths. Never assume `/home/` or `C:\Users\`.

---

## TUI Architecture

The TUI is a **custom terminal renderer** — no Ink, no blessed. Direct stdout writes with ANSI escape codes. Inspired by opencode's approach.

### Rendering Model

- **Full repaint on state change** — diff is cheap enough for a config tool
- **Fixed layout** — split into regions, calculated on terminal resize (`SIGWINCH` / `process.stdout.on('resize')`)
- **60fps cap** — debounce repaints, never render more than needed
- **Windows compatibility** — use `process.stdout.write` with proper ANSI, enable VT processing on Windows via `SetConsoleMode`

### Layout (default screen)

```
┌─────────────────────────────────────────────────────────┐
│  addx  [All] [MCP] [Skills] [Plugins] [Installed]       │  ← tabs / header
├──────────────────────┬──────────────────────────────────┤
│  🔍 search...        │                                  │
│                      │   Context7                       │
│  Context7        MCP │                                  │
│  Neon            MCP │   Up-to-date docs for any        │
│  GitHub          MCP │   library, straight into your    │
│  ...                 │   prompt.                        │
│                      │                                  │
│                      │   Author: upstash                │
│                      │   Type: MCP (HTTP)               │
│                      │   Tags: docs, context            │
│                      │                                  │
│                      │   [ Install ]                    │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│  ↑↓ navigate  enter/click select  / search  q quit      │  ← status bar
└─────────────────────────────────────────────────────────┘
```

### Install Flow (triggered by clicking Install or pressing Enter)

```
┌─────────────────────────────────────────────────────────┐
│  Install: Context7                                       │
│                                                          │
│  Scope:                                                  │
│  ● Project (current directory)                           │
│  ○ Global                                               │
│                                                          │
│  Install to:                                             │
│  ☑ Claude Code    ☑ Cursor    ☐ VSCode                  │
│  ☐ Claude Desktop ☐ Windsurf  ☐ Zed                     │
│  (auto-detected agents are pre-checked)                  │
│                                                          │
│  Env vars: (if required)                                 │
│  API_KEY: [________________________]                     │
│                                                          │
│  [ Cancel ]                    [ Confirm Install ]       │
└─────────────────────────────────────────────────────────┘
```

### Mouse Support

Enable mouse tracking on startup:
```typescript
process.stdout.write('\x1b[?1000h') // enable mouse click tracking
process.stdout.write('\x1b[?1002h') // enable mouse drag tracking
process.stdout.write('\x1b[?1006h') // enable SGR extended mouse (needed for large terminals)
```

Disable on exit (always, including SIGINT/SIGTERM):
```typescript
process.stdout.write('\x1b[?1000l')
process.stdout.write('\x1b[?1002l')
process.stdout.write('\x1b[?1006l')
```

On Windows, check `process.platform === 'win32'` and use `WriteConsoleInput` fallback if SGR mouse doesn't work. Test on both Windows Terminal (modern, supports VT) and CMD/PowerShell (legacy).

---

## CLI Interface (non-TUI mode)

When no TTY is detected (piped, CI environment), or when explicit flags are passed, addx operates as a standard CLI:

```bash
# Launch TUI (default)
npx addx

# Non-interactive: install directly
npx addx install context7 --target cursor --target claude-code --global

# List installed
npx addx list
npx addx list --global

# Remove
npx addx remove context7

# Search (prints results, no TUI)
npx addx search "postgres"

# Show info about an item
npx addx info context7
```

---

## Install Scope Rules

| Flag | Behavior |
|---|---|
| (none, default) | Project scope — writes to CWD config files |
| `--global` / `-g` | Global scope — writes to user home config files |

In TUI, the install modal always asks the user to choose scope before confirming.

Auto-detection: on launch, scan CWD for project-level config files (`.cursor/`, `.mcp.json`, `.vscode/mcp.json`, etc.) and pre-select detected agents in the install modal.

---

## Error Handling

- Never crash silently — all errors must be caught and shown to the user in the TUI or stderr
- File write failures: show the target path and the OS error, offer to retry
- Unknown agent config format: warn and skip, never corrupt existing config
- Missing env vars: prompt the user in the install modal before proceeding
- Partial installs: if installing to 3 agents and 1 fails, report which succeeded and which failed — never roll back successful installs silently

---

## Windows-Specific Notes

- **Path separator:** always use `path.join()` / `path.resolve()`, never string concatenation with `/`
- **ANSI support:** Windows 10+ supports VT100 via `SetConsoleMode`. For older terminals, gracefully degrade (no colors, ASCII borders instead of Unicode box-drawing)
- **Mouse:** Windows Terminal supports SGR mouse. CMD/PowerShell may not — detect and disable mouse mode gracefully
- **Config paths:** always use `%APPDATA%` via `process.env.APPDATA`, never hardcode `C:\Users\`
- **Line endings:** write config files with the appropriate line endings (`\r\n` on Windows for JSON, though JSON parsers handle both)
- **Unicode box-drawing chars:** test on Windows CMD — if not supported, use ASCII fallback (`+`, `-`, `|`)

---

## Development

```bash
# Install deps
bun install

# Run in dev mode (watch)
bun --watch src/index.ts

# Run tests
bun test

# Lint + format
bunx biome check --write src/

# Build single-file bundle for npm
bun build src/index.ts --outfile dist/addx.js --target node --minify

# Test the built bundle
node dist/addx.js
```

### package.json bin field

```json
{
  "name": "addx",
  "bin": {
    "addx": "./dist/addx.js"
  },
  "files": ["dist/", "registry.json"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Contributing to the Registry

Anyone can add an MCP server, skill, plugin, or other item by opening a PR that edits `registry.json`. The PR should:

1. Add a valid entry following the schema defined in this file
2. Include `id`, `name`, `description`, `type`, `transport` or equivalent, and `targets`
3. Not duplicate an existing `id`
4. Have a working `url` (for HTTP/SSE transport) or valid `command` (for stdio)

See `CONTRIBUTING.md` for full guidelines.

---

## Key Decisions & Rationale

| Decision | Rationale |
|---|---|
| Custom TUI renderer (not Ink) | Full control over mouse, layout, and feel — Ink's abstraction limits what we can do |
| Bun for dev, Node for distribution | Best dev DX + maximum user compatibility (no Bun required) |
| Flat `registry.json`, no backend | Community-driven, no infra to maintain, transparent, PR-auditable |
| Both project + global scope | Mirrors how developers actually work — per-project or machine-wide |
| Extensible `type` field | Future-proof without breaking registry schema |
| One installer file per agent | Easy to add new agents, easy to debug per-agent issues |
| `src/platform/paths.ts` as single source of truth | All path logic in one place, never scattered across installers |
