// Minimal status bar — dim text, no background.

import { dim, padRight, visibleLength } from '../draw.js'
import type { Box } from '../layout.js'

export interface StatusbarProps {
  left: string
  right: string
}

export function renderStatusbar(props: StatusbarProps, box: Box): string[] {
  const left = `  ${dim(props.left)}`
  const right = `${dim(props.right)}  `
  const used = visibleLength(left) + visibleLength(right)
  const gap = Math.max(1, box.w - used)
  return [padRight(left + ' '.repeat(gap) + right, box.w)]
}
