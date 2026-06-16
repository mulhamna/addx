// Core renderer: enters alt screen, manages mouse + raw keyboard, paints frames, cleans up on exit.

import { RESET, padRight, truncate } from './draw.js'
import { disableRawInput, enableRawInput, parseKey } from './keyboard.js'
import type { KeyEvent } from './keyboard.js'
import { getTerminalSize } from './layout.js'
import { disableMouse, enableMouse, parseMouse } from './mouse.js'
import type { MouseEvent } from './mouse.js'

const ALT_SCREEN_ENTER = '\x1b[?1049h'
const ALT_SCREEN_EXIT = '\x1b[?1049l'
const HIDE_CURSOR = '\x1b[?25l'
const SHOW_CURSOR = '\x1b[?25h'
const CLEAR_SCREEN = '\x1b[2J\x1b[H'
const RESET_ATTRS = '\x1b[0m'

export interface RendererCallbacks {
  onKey?: (e: KeyEvent) => void
  onMouse?: (e: MouseEvent) => void
  onResize?: (size: { w: number; h: number }) => void
  /** Render function returning lines to paint (each line indexed by row). */
  render: (size: { w: number; h: number }) => string[]
}

export class Renderer {
  private cb: RendererCallbacks
  private mounted = false
  private repaintScheduled = false
  private cleanupHooks: Array<() => void> = []

  constructor(cb: RendererCallbacks) {
    this.cb = cb
  }

  mount(): void {
    if (this.mounted) return
    this.mounted = true
    process.stdout.write(ALT_SCREEN_ENTER)
    process.stdout.write(HIDE_CURSOR)
    process.stdout.write(CLEAR_SCREEN)
    enableMouse()
    enableRawInput()

    const onData = (buf: Buffer): void => this.handleInput(buf.toString('utf8'))
    process.stdin.on('data', onData)
    this.cleanupHooks.push(() => process.stdin.off('data', onData))

    const onResize = (): void => {
      this.cb.onResize?.(getTerminalSize())
      this.paint()
    }
    process.stdout.on('resize', onResize)
    this.cleanupHooks.push(() => process.stdout.off('resize', onResize))

    const onExit = (): void => this.unmount()
    process.on('exit', onExit)
    process.on('SIGINT', () => {
      this.unmount()
      process.exit(130)
    })
    process.on('SIGTERM', () => {
      this.unmount()
      process.exit(143)
    })

    this.paint()
  }

  unmount(): void {
    if (!this.mounted) return
    this.mounted = false
    for (const fn of this.cleanupHooks) {
      try {
        fn()
      } catch {
        // ignore
      }
    }
    this.cleanupHooks = []
    disableMouse()
    disableRawInput()
    process.stdout.write(SHOW_CURSOR)
    process.stdout.write(RESET_ATTRS)
    process.stdout.write(ALT_SCREEN_EXIT)
  }

  /** Schedule a repaint on the next tick — coalesces multiple state changes. */
  schedulePaint(): void {
    if (this.repaintScheduled) return
    this.repaintScheduled = true
    setImmediate(() => {
      this.repaintScheduled = false
      this.paint()
    })
  }

  private paint(): void {
    if (!this.mounted) return
    const size = getTerminalSize()
    const lines = this.cb.render(size)
    let out = '\x1b[H'
    for (let i = 0; i < size.h; i++) {
      const raw = lines[i] ?? ''
      const trimmed = truncate(raw, size.w)
      const padded = padRight(trimmed, size.w)
      out += padded + RESET
      if (i < size.h - 1) out += '\n'
    }
    process.stdout.write(out)
  }

  private handleInput(raw: string): void {
    const mouse = parseMouse(raw)
    if (mouse) {
      this.cb.onMouse?.(mouse)
      return
    }
    const key = parseKey(raw)
    this.cb.onKey?.(key)
  }
}
