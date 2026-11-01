import { describe, expect, it } from 'vitest'
import { areas, pois, regions } from './markers'
import type { Visibility } from './markers'

// markers.ts is edited by hand, so catch the usual slips: swapped coordinates, empty names, broken zoom ranges.
const located = [
  ...pois.map((m) => ({ label: m.title, position: m.position, range: m as Visibility })),
  ...areas.map((m) => ({ label: m.title, position: m.position, range: m as Visibility })),
  ...regions.map((m) => ({ label: m.name, position: m.position, range: m as Visibility }))
]

describe('markers', () => {
  it.each(located)('$label: has a name, a position near Ludwigsburg and a sane zoom range', (m) => {
    expect(m.label.trim()).not.toBe('')
    expect(m.position.lat).toBeGreaterThan(48.8)
    expect(m.position.lat).toBeLessThan(49.0)
    expect(m.position.lng).toBeGreaterThan(9.0)
    expect(m.position.lng).toBeLessThan(9.4)
    if (m.range.minZoom !== undefined && m.range.maxZoom !== undefined) {
      expect(m.range.minZoom).toBeLessThanOrEqual(m.range.maxZoom)
    }
  })

  it('gives every area a positive radius', () => {
    for (const area of areas) expect(area.radiusMeters).toBeGreaterThan(0)
  })
})
