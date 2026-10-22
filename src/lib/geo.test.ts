import { describe, expect, it } from 'vitest'
import {
  angleDifference,
  bearingDegrees,
  beepIntervalMs,
  compassHeading,
  distanceMeters,
  isFacing,
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

describe('bearingDegrees', () => {
  it('points north, east, south and west', () => {
    const origin = { lat: 48, lng: 9 }
    expect(bearingDegrees(origin, { lat: 49, lng: 9 })).toBeCloseTo(0, 5)
    expect(bearingDegrees(origin, { lat: 48, lng: 10 })).toBeCloseTo(90, 0)
    expect(bearingDegrees(origin, { lat: 47, lng: 9 })).toBeCloseTo(180, 5)
    expect(bearingDegrees(origin, { lat: 48, lng: 8 })).toBeCloseTo(270, 0)
  })
  it('never returns a negative angle', () => {
    expect(bearingDegrees(favorite, schloss)).toBeGreaterThanOrEqual(0)
    expect(bearingDegrees(favorite, schloss)).toBeLessThan(360)
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

describe('isFacing', () => {
  it('handles the 360 wrap', () => {
    expect(isFacing(355, 5, 30)).toBe(true)
    expect(isFacing(5, 355, 30)).toBe(true)
  })
  it('rejects headings outside the tolerance', () => {
    expect(isFacing(0, 90, 30)).toBe(false)
    expect(isFacing(0, 180, 30)).toBe(false)
  })
})

describe('beepIntervalMs', () => {
  const range = { nearMeters: 10, farMeters: 510, fastIntervalMs: 400, slowIntervalMs: 3000 }
  it('clamps to the fast interval when near', () => {
    expect(beepIntervalMs(0, range)).toBe(400)
    expect(beepIntervalMs(10, range)).toBe(400)
  })
  it('clamps to the slow interval when far', () => {
    expect(beepIntervalMs(510, range)).toBe(3000)
    expect(beepIntervalMs(50000, range)).toBe(3000)
  })
  it('interpolates linearly and gets faster the closer you are', () => {
    expect(beepIntervalMs(260, range)).toBe(1700)
    expect(beepIntervalMs(100, range)).toBeLessThan(beepIntervalMs(200, range))
  })
})
