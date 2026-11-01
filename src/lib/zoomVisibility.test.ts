import { describe, expect, it } from 'vitest'
import { zoomOpacity } from './zoomVisibility'

describe('zoomOpacity', () => {
  it('is always visible without bounds', () => {
    expect(zoomOpacity(3, {})).toBe(1)
    expect(zoomOpacity(20, {})).toBe(1)
  })

  it('is fully visible inside the range, including its bounds', () => {
    expect(zoomOpacity(15, { minZoom: 14, maxZoom: 16 })).toBe(1)
    expect(zoomOpacity(14, { minZoom: 14, maxZoom: 16 })).toBe(1)
    expect(zoomOpacity(16, { minZoom: 14, maxZoom: 16 })).toBe(1)
  })

  it('fades out above maxZoom and is gone after the fade distance', () => {
    expect(zoomOpacity(16.375, { maxZoom: 16 }, 0.75)).toBeCloseTo(0.5)
    expect(zoomOpacity(16.75, { maxZoom: 16 }, 0.75)).toBe(0)
    expect(zoomOpacity(19, { maxZoom: 16 })).toBe(0)
  })

  it('fades in below minZoom', () => {
    expect(zoomOpacity(13.625, { minZoom: 14 }, 0.75)).toBeCloseTo(0.5)
    expect(zoomOpacity(13.25, { minZoom: 14 }, 0.75)).toBe(0)
  })
})
