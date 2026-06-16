// Raw terminal mouse protocol (SGR extended). Required to handle clicks in the TUI.

export type MouseAction = 'press' | 'release' | 'move' | 'drag'

export interface MouseEvent {
  x: number
  y: number
  button: number
  action: MouseAction
}

export function enableMouse(): void {
  process.stdout.write('\x1b[?1000h')
  process.stdout.write('\x1b[?1002h')
  process.stdout.write('\x1b[?1006h')
}

export function disableMouse(): void {
  process.stdout.write('\x1b[?1006l')
  process.stdout.write('\x1b[?1002l')
  process.stdout.write('\x1b[?1000l')
}

const SGR_MOUSE_RE = new RegExp(`^${String.fromCharCode(27)}\\[<(\\d+);(\\d+);(\\d+)([Mm])$`)

/** Parse SGR mouse sequence: ESC [ < button ; x ; y (M|m). Returns null if not a mouse event. */
export function parseMouse(seq: string): MouseEvent | null {
  const m = seq.match(SGR_MOUSE_RE)
  if (!m) return null
  const [, btnStr, xStr, yStr, terminator] = m
  const button = Number(btnStr ?? '0')
  const x = Number(xStr ?? '1') - 1
  const y = Number(yStr ?? '1') - 1
  const isPress = terminator === 'M'
  const isDrag = (button & 32) !== 0
  const isMove = button === 35
  const action: MouseAction = isMove ? 'move' : isDrag ? 'drag' : isPress ? 'press' : 'release'
  return { x, y, button: button & 3, action }
}
