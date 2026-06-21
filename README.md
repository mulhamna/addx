# addx

> `npx @mulham28/addx` — the universal AI tools manager.

Browse, install, and manage MCP servers, skills, plugins, and other AI tooling across Claude Code, Cursor, VSCode, Windsurf, Zed, OpenCode, Gemini CLI, Cline, and more — from a single mouse-clickable TUI.

## Quick start

```bash
npx @mulham28/addx
```

That's it. No install, no config. Launches an interactive TUI in your terminal.

## Installation (Optional)

Install `addx` globally to run it directly:

### npm
```bash
npm install -g @mulham28/addx
```

### Homebrew (macOS & Linux)
```bash
brew install mulhamna/tap/addx
```

### Scoop (Windows)
```powershell
scoop bucket add mulhamna https://github.com/mulhamna/scoop-bucket
scoop install addx
```

### Install script
```bash
# macOS & Linux
curl -fsSL https://raw.githubusercontent.com/mulhamna/addx/main/install.sh | bash
# Windows (PowerShell)
iex (iwr -useb https://raw.githubusercontent.com/mulhamna/addx/main/install.ps1)
```

## Non-interactive usage

```bash
# Install an MCP server to specific agents
npx @mulham28/addx install context7 --target cursor --target claude-code

# Global scope (machine-wide instead of current project)
npx @mulham28/addx install context7 --target claude-code --global

# List installed items
npx @mulham28/addx list

# Remove
npx @mulham28/addx remove context7

# Search the registry
npx @mulham28/addx search "postgres"

# Show item info
npx @mulham28/addx info context7
```

## Supported agents

Claude Code, Claude Desktop, Cursor, VSCode (GitHub Copilot), Windsurf, Zed, OpenCode, Gemini CLI, Cline.

## Contributing

The registry is a community-curated `registry.json` in this repo. To add an MCP server, skill, plugin, or other item — open a PR. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
