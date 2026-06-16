// Raw mode keyboard handling — parse ANSI key sequences into named keys.

export interface KeyEvent {
  name: string
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
  raw: string
}

export function enableRawInput(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
  }
}

export function disableRawInput(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
    process.stdin.pause()
  }
}

/** Parse a single keypress chunk. */
export function parseKey(raw: string): KeyEvent {
  if (raw === '\x03') return { name: 'ctrl-c', ctrl: true, raw }
  if (raw === '\x1b') return { name: 'escape', raw }
  if (raw === '\r' || raw === '\n') return { name: 'enter', raw }
  if (raw === '\t') return { name: 'tab', raw }
  if (raw === '\x7f' || raw === '\b') return { name: 'backspace', raw }

  if (raw === '\x1b[A') return { name: 'up', raw }
  if (raw === '\x1b[B') return { name: 'down', raw }
  if (raw === '\x1b[C') return { name: 'right', raw }
  if (raw === '\x1b[D') return { name: 'left', raw }
  if (raw === '\x1b[H') return { name: 'home', raw }
  if (raw === '\x1b[F') return { name: 'end', raw }
  if (raw === '\x1b[5~') return { name: 'pageup', raw }
  if (raw === '\x1b[6~') return { name: 'pagedown', raw }

  if (raw.length === 1) {
    const code = raw.charCodeAt(0)
    if (code >= 1 && code <= 26) {
      return { name: `ctrl-${String.fromCharCode(code + 96)}`, ctrl: true, raw }
    }
    return { name: raw, raw }
  }
  return { name: 'unknown', raw }
}
