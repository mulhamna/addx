// Safe file read/write helpers with atomic writes and format-aware parsing.

import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'

export async function ensureDir(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
}

export async function atomicWrite(filePath: string, contents: string): Promise<void> {
  await ensureDir(filePath)
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmp, contents, 'utf8')
  await rename(tmp, filePath)
}

export async function readJson<T = unknown>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null
  const raw = await readFile(filePath, 'utf8')
  if (raw.trim() === '') return null
  return JSON.parse(raw) as T
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  const contents = `${JSON.stringify(data, null, 2)}\n`
  await atomicWrite(filePath, contents)
}

export async function readToml<T = unknown>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null
  const raw = await readFile(filePath, 'utf8')
  if (raw.trim() === '') return null
  return parseToml(raw) as T
}

export async function writeToml(filePath: string, data: Record<string, unknown>): Promise<void> {
  const contents = stringifyToml(data)
  await atomicWrite(filePath, `${contents}\n`)
}

/** Minimal YAML support — we only emit/read the shallow shape used by goose config. */
export async function readYaml<T = unknown>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null
  const raw = await readFile(filePath, 'utf8')
  return parseSimpleYaml(raw) as T
}

export async function writeYaml(filePath: string, data: Record<string, unknown>): Promise<void> {
  await atomicWrite(filePath, stringifySimpleYaml(data))
}

function parseSimpleYaml(raw: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/)
    if (!m) continue
    const [, k, v] = m
    if (!k) continue
    out[k] = v === '' ? null : tryJson(v ?? '')
  }
  return out
}

function tryJson(v: string): unknown {
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

function stringifySimpleYaml(data: Record<string, unknown>): string {
  return `${Object.entries(data)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n')}\n`
}
