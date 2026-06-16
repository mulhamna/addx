// Geometry primitives for the TUI layout engine.

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export function box(x: number, y: number, w: number, h: number): Box {
  return { x, y, w, h }
}

export function splitHorizontal(parent: Box, leftWidth: number, gap = 0): [Box, Box] {
  const left = box(parent.x, parent.y, leftWidth, parent.h)
  const right = box(parent.x + leftWidth + gap, parent.y, parent.w - leftWidth - gap, parent.h)
  return [left, right]
}

export function splitVertical(parent: Box, topHeight: number, gap = 0): [Box, Box] {
  const top = box(parent.x, parent.y, parent.w, topHeight)
  const bottom = box(parent.x, parent.y + topHeight + gap, parent.w, parent.h - topHeight - gap)
  return [top, bottom]
}

export function pointInBox(x: number, y: number, b: Box): boolean {
  return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h
}

export function getTerminalSize(): { w: number; h: number } {
  return {
    w: process.stdout.columns || 80,
    h: process.stdout.rows || 24,
  }
}
