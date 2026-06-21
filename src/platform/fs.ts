// Safe file read/write helpers with atomic writes. All live agent configs are JSON.

import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

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
