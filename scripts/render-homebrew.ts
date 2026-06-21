// Generate a Homebrew formula for the compiled binaries.
// Usage: bun scripts/render-homebrew.ts <SHA256SUMS> <out.rb>
// Env: VERSION, TAG, REPO (e.g. mulhamna/addx)

import { readFileSync, writeFileSync } from 'node:fs'

const [shaFile, outFile] = process.argv.slice(2)
if (!shaFile || !outFile) throw new Error('usage: render-homebrew.ts <SHA256SUMS> <out.rb>')

const version = reqEnv('VERSION')
const tag = reqEnv('TAG')
const repo = reqEnv('REPO')

// SHA256SUMS lines: "<hash>  <filename>"
const sha: Record<string, string> = {}
for (const line of readFileSync(shaFile, 'utf8').split('\n')) {
  const m = line.trim().match(/^(\w{64})\s+\*?(.+)$/)
  if (m?.[1] && m[2]) sha[m[2]] = m[1]
}

const url = (asset: string) => `https://github.com/${repo}/releases/download/${tag}/${asset}`
const need = (asset: string) => {
  const h = sha[asset]
  if (!h) throw new Error(`missing sha256 for ${asset} in ${shaFile}`)
  return h
}

const formula = `class Addx < Formula
  desc "Universal AI tooling manager with a mouse-clickable TUI"
  homepage "https://github.com/${repo}"
  version "${version}"

  on_macos do
    on_arm do
      url "${url('addx-darwin-arm64')}"
      sha256 "${need('addx-darwin-arm64')}"
    end
    on_intel do
      url "${url('addx-darwin-x64')}"
      sha256 "${need('addx-darwin-x64')}"
    end
  end

  on_linux do
    on_arm do
      url "${url('addx-linux-arm64')}"
      sha256 "${need('addx-linux-arm64')}"
    end
    on_intel do
      url "${url('addx-linux-x64')}"
      sha256 "${need('addx-linux-x64')}"
    end
  end

  def install
    bin.install Dir["addx-*"].first => "addx"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/addx --version")
  end
end
`

writeFileSync(outFile, formula)
console.log(`wrote ${outFile} (v${version})`)

function reqEnv(k: string): string {
  const v = process.env[k]
  if (!v) throw new Error(`env ${k} required`)
  return v
}
