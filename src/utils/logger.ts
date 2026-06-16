// Structured logger that respects TUI mode (writes to stderr) and a debug flag.

let debugEnabled = process.env.ADDX_DEBUG === '1' || process.env.ADDX_DEBUG === 'true'

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled
}

function write(level: string, args: unknown[]): void {
  const prefix = `[addx ${level}]`
  process.stderr.write(`${prefix} ${args.map(format).join(' ')}\n`)
}

function format(v: unknown): string {
  if (typeof v === 'string') return v
  if (v instanceof Error) return v.stack ?? v.message
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export const log = {
  debug: (...a: unknown[]): void => {
    if (debugEnabled) write('debug', a)
  },
  info: (...a: unknown[]): void => write('info', a),
  warn: (...a: unknown[]): void => write('warn', a),
  error: (...a: unknown[]): void => write('error', a),
}
