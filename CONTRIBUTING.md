# Contributing to addx

Thanks for helping grow the addx registry. The registry is a flat `registry.json` in the repo root — community-curated, PR-auditable, no hosted backend.

## Adding an item to the registry

Open a PR that edits `registry.json`. Append a new entry to the `items` array following this schema:

```jsonc
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "description": "One-line description shown in the list.",
  "type": "mcp",
  "author": "your-org",
  "repo": "https://github.com/your-org/your-mcp",
  "tags": ["docs", "search"],
  "transport": {
    "type": "http",
    "url": "https://mcp.example.com/mcp"
  },
  "targets": ["claude-code", "cursor", "vscode", "claude-desktop"],
  "env": [
    { "key": "API_KEY", "description": "Your API key", "required": false }
  ],
  "homepage": "https://example.com"
}
```

### Required fields

- `id` — unique, kebab-case
- `name` — display name
- `description` — short, single-line
- `type` — one of `mcp` | `skill` | `plugin` | `prompt` | `theme`
- `targets` — array of supported agent IDs, or `["*"]` for all
- `transport` — for `type: "mcp"`. Shape: `{ type: "http" | "sse", url }` or `{ type: "stdio", command, args, env }`

### Checklist before opening the PR

- [ ] `id` not duplicated
- [ ] Valid JSON (run `bunx biome format --write registry.json`)
- [ ] For HTTP/SSE transport: URL is reachable
- [ ] For stdio transport: command + args are correct and the package is published
- [ ] Targets list is accurate (only agents this item actually works with)

## Adding a new agent installer

1. Add a new file under `src/installers/agents/<agent-id>.ts` implementing the `Installer` interface from `src/installers/base.ts`
2. Add path resolution in `src/platform/paths.ts`
3. Register in `src/installers/index.ts`
4. Add a smoke test in `tests/installers/<agent-id>.test.ts`

## Development

```bash
bun install
bun run dev       # watch mode
bun test
bun run lint:fix  # biome
bun run build     # produce dist/addx.js
```

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/). CI lints
both your PR title and every commit. `feat:` bumps the minor version, `fix:` the patch
version, and a `!`/`BREAKING CHANGE` footer the major version — release-please reads these
to drive releases automatically.

## Releases (maintainers)

Releases are automated:

1. Merging Conventional Commits to `main` makes [release-please](https://github.com/googleapis/release-please) open/maintain a release PR that bumps the version + changelog.
2. Merging that PR cuts a GitHub Release + tag.
3. The Release triggers `release.yml`, which (after manual approval on the `release` environment) compiles binaries, publishes to npm + GitHub Packages, and updates the Homebrew tap and Scoop bucket.

### Required repository secrets

| Secret | Used for |
|---|---|
| `RELEASE_PLEASE_TOKEN` | PAT release-please uses so the created Release can trigger `release.yml` |
| `NPM_TOKEN` | Publishing `@mulham28/addx` to npm |
| `RELEASE_ADDX` | PAT to push the formula/manifest to `mulhamna/homebrew-tap` and `mulhamna/scoop-bucket` |

`GITHUB_TOKEN` is provided automatically (used for the GitHub Packages publish + release uploads).
The `release` environment gates all publish jobs behind owner approval.

## Code style

Biome enforces formatting and linting. Run `bun run lint:fix` before committing.
