export interface ZoomRange {
  minZoom?: number
  maxZoom?: number
}

/**
 * Opacity of a marker at a zoom level: 1 inside [minZoom, maxZoom], fading linearly to 0 over `fade` zoom levels
 * just outside of it, so markers do not pop. A missing bound means no limit on that side.
 */
export function zoomOpacity(zoom: number, { minZoom, maxZoom }: ZoomRange, fade = 0.75): number {
  let opacity = 1
  if (minZoom !== undefined) opacity = Math.min(opacity, (zoom - (minZoom - fade)) / fade)
  if (maxZoom !== undefined) opacity = Math.min(opacity, (maxZoom + fade - zoom) / fade)
  return Math.max(0, Math.min(1, opacity))
}
