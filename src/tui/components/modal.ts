// Centered modal frame with title, body lines, and a button row.

import type { Box } from '../layout.js'

export interface ModalProps {
  title: string
  body: string[]
  buttons: string[]
  focusedButton: number
}

export function renderModal(props: ModalProps, terminal: Box): string[] {
  const w = Math.min(60, terminal.w - 4)
  const h = Math.min(props.body.length + 6, terminal.h - 4)
  const x = Math.floor((terminal.w - w) / 2)
  const y = Math.floor((terminal.h - h) / 2)

  const lines: string[] = Array(terminal.h).fill('')
  const top = `┌─ ${props.title} ${'─'.repeat(Math.max(0, w - props.title.length - 4))}┐`
  const bottom = `└${'─'.repeat(w - 2)}┘`

  const rows: string[] = [top]
  for (const b of props.body) rows.push(`│ ${b.padEnd(w - 4).slice(0, w - 4)} │`)
  while (rows.length < h - 2) rows.push(`│${' '.repeat(w - 2)}│`)
  const btnRow = props.buttons
    .map((b, i) => (i === props.focusedButton ? `\x1b[7m [${b}] \x1b[0m` : `  ${b}  `))
    .join('')
  rows.push(`│ ${btnRow.padEnd(w - 4).slice(0, w - 4)} │`)
  rows.push(bottom)

  for (let i = 0; i < rows.length; i++) {
    const out: string[] = Array(terminal.w).fill(' ')
    const row = rows[i] ?? ''
    for (let j = 0; j < row.length && x + j < terminal.w; j++) {
      out[x + j] = row[j] ?? ' '
    }
    lines[y + i] = out.join('')
  }
  return lines
}
