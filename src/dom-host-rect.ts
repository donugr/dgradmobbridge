import type { NativeHostAnchor, NativeHostRect } from "./definitions"

export type NativeHostRectOptions = {
  anchor?: NativeHostAnchor
  offsetX?: number
  offsetY?: number
  minWidth?: number
  minHeight?: number
}

export function buildNativeHostRect(element: Element, options: NativeHostRectOptions = {}): NativeHostRect {
  const rect = element.getBoundingClientRect()
  const anchor = options.anchor ?? "top"
  const x = Math.max(0, Math.round(rect.left + (options.offsetX ?? 0)))
  const y = Math.max(0, Math.round(rect.top + (options.offsetY ?? 0)))
  const width = Math.max(
    Math.round(options.minWidth ?? 0),
    Math.round(rect.width),
  )
  const height = Math.max(
    Math.round(options.minHeight ?? 0),
    Math.round(rect.height),
  )

  return {
    x,
    y,
    width,
    height,
    anchor,
  }
}
