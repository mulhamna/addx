# addx

> `npx addx` — the universal AI tools manager.

Browse, install, and manage MCP servers, skills, plugins, and other AI tooling across Claude Code, Cursor, VSCode, Windsurf, Zed, OpenCode, Gemini CLI, Cline, Goose, and more — from a single mouse-clickable TUI.

## Quick start

```bash
npx addx
```

That's it. No install, no config. Launches an interactive TUI in your terminal.

## Installation (Optional)

If you want to install `addx` globally on your system to run it directly:

### macOS & Linux
```bash
curl -fsSL https://raw.githubusercontent.com/mulhamna/addx/main/install.sh | bash
```

### Windows (PowerShell)
```powershell
iex (iwr -useb https://raw.githubusercontent.com/mulhamna/addx/main/install.ps1)
```

## Non-interactive usage

```bash
# Install an MCP server to specific agents
npx addx install context7 --target cursor --target claude-code

# Global scope (machine-wide instead of current project)
npx addx install context7 --target claude-code --global

# List installed items
npx addx list

# Remove
npx addx remove context7

# Search the registry
npx addx search "postgres"

# Show item info
npx addx info context7
```

## Supported agents

Claude Code, Claude Desktop, Cursor, VSCode (GitHub Copilot), Windsurf, Zed, OpenCode, Gemini CLI, Cline, Goose.

## Contributing

The registry is a community-curated `registry.json` in this repo. To add an MCP server, skill, plugin, or other item — open a PR. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
