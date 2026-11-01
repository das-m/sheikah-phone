import { describe, expect, it } from 'vitest'
import {
  angleDifference,
  compassHeading,
  distanceMeters,
  metersPerPixel,
  normalizeDegrees
} from './geo'

const schloss = { lat: 48.899614, lng: 9.195613 }
const favorite = { lat: 48.904458, lng: 9.196029 }

describe('normalizeDegrees', () => {
  it('wraps into [0, 360)', () => {
    expect(normalizeDegrees(0)).toBe(0)
    expect(normalizeDegrees(360)).toBe(0)
    expect(normalizeDegrees(-90)).toBe(270)
    expect(normalizeDegrees(725)).toBe(5)
  })
})

describe('angleDifference', () => {
  it('takes the short way around 0/360', () => {
    expect(angleDifference(350, 10)).toBe(20)
    expect(angleDifference(10, 350)).toBe(-20)
  })
  it('is 0 for identical angles', () => {
    expect(angleDifference(123, 123)).toBe(0)
  })
})

describe('distanceMeters', () => {
  it('is 0 for the same point', () => {
    expect(distanceMeters(schloss, schloss)).toBe(0)
  })
  it('matches ~1 degree of latitude = 111.2 km', () => {
    const d = distanceMeters({ lat: 48, lng: 9 }, { lat: 49, lng: 9 })
    expect(d).toBeGreaterThan(111000)
    expect(d).toBeLessThan(111500)
  })
  it('measures Residenzschloss to Schloss Favorite at roughly half a kilometer', () => {
    const d = distanceMeters(schloss, favorite)
    expect(d).toBeGreaterThan(500)
    expect(d).toBeLessThan(600)
  })
})

describe('compassHeading', () => {
  it('flat: is 0 when the top edge points north, and turns clockwise as alpha decreases', () => {
    expect(compassHeading(0, 0, 0)).toBeCloseTo(0, 5)
    expect(compassHeading(270, 0, 0)).toBeCloseTo(90, 5)
    expect(compassHeading(180, 0, 0)).toBeCloseTo(180, 5)
    expect(compassHeading(90, 0, 0)).toBeCloseTo(270, 5)
  })
  it('upright: is the direction the back camera points to', () => {
    expect(compassHeading(0, 90, 0)).toBeCloseTo(0, 5)
    expect(compassHeading(270, 90, 0)).toBeCloseTo(90, 5)
    expect(compassHeading(180, 90, 0)).toBeCloseTo(180, 5)
    expect(compassHeading(90, 90, 0)).toBeCloseTo(270, 5)
  })
})

describe('metersPerPixel', () => {
  it('is the known ground resolution at the equator and halves per zoom level', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(78271.517, 2)
    expect(metersPerPixel(0, 1)).toBeCloseTo(78271.517 / 2, 2)
  })

  it('shrinks with the latitude', () => {
    expect(metersPerPixel(48.9, 17)).toBeCloseTo(0.3926, 3)
  })
})
