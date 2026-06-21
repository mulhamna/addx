// Generate a Scoop manifest for the compiled Windows binary.
// Usage: bun scripts/render-scoop.ts <SHA256SUMS> <out.json>
// Env: VERSION, TAG, REPO (e.g. mulhamna/addx)

import { readFileSync, writeFileSync } from 'node:fs'

const [shaFile, outFile] = process.argv.slice(2)
if (!shaFile || !outFile) throw new Error('usage: render-scoop.ts <SHA256SUMS> <out.json>')

const version = reqEnv('VERSION')
const tag = reqEnv('TAG')
const repo = reqEnv('REPO')

const sha: Record<string, string> = {}
for (const line of readFileSync(shaFile, 'utf8').split('\n')) {
  const m = line.trim().match(/^(\w{64})\s+\*?(.+)$/)
  if (m?.[1] && m[2]) sha[m[2]] = m[1]
}

const asset = 'addx-windows-x64.exe'
const hash = sha[asset]
if (!hash) throw new Error(`missing sha256 for ${asset} in ${shaFile}`)

// ponytail: 64bit only — add arm64 when Scoop arm support matters.
const manifest = {
  version,
  description: 'Universal AI tooling manager with a mouse-clickable TUI',
  homepage: `https://github.com/${repo}`,
  license: 'MIT',
  architecture: {
    '64bit': {
      url: `https://github.com/${repo}/releases/download/${tag}/${asset}`,
      hash,
      bin: [[asset, 'addx']],
    },
  },
  checkver: 'github',
  autoupdate: {
    architecture: {
      '64bit': {
        url: `https://github.com/${repo}/releases/download/v$version/${asset}`,
      },
    },
  },
}

writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`wrote ${outFile} (v${version})`)

function reqEnv(k: string): string {
  const v = process.env[k]
  if (!v) throw new Error(`env ${k} required`)
  return v
}
