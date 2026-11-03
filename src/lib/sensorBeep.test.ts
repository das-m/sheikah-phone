import { describe, expect, it } from 'vitest'
import {
  beepIntervalMs,
  beepVolume,
  foundRadius,
  formatApproxDistance,
  isBeepAudible,
  isFound,
  type BeepTuning
} from './sensorBeep'

const tuning: BeepTuning = {
  nearMeters: 10,
  farMeters: 510,
  fastIntervalMs: 300,
  slowIntervalMs: 2500,
  curve: 0.6,
  centerIntervalFactor: 0.5,
  aimEdgeDeg: 30,
  farVolume: 0.25,
  nearVolume: 1,
  foundMinMeters: 5,
  foundMaxMeters: 20,
  foundIntervalMs: 250
}
const radius = 5

describe('beepIntervalMs', () => {
  it('is slow far away and fast up close (at the edge of the cone)', () => {
    expect(beepIntervalMs(510, 30, radius, tuning)).toBeCloseTo(2500)
    expect(beepIntervalMs(1000, 30, radius, tuning)).toBeCloseTo(2500)
    expect(beepIntervalMs(10, 30, radius, tuning)).toBeCloseTo(300)
  })

  it('only gets shorter the closer you get', () => {
    let last = Infinity
    for (let d = 600; d >= 6; d -= 7) {
      const interval = beepIntervalMs(d, 0, radius, tuning)
      expect(interval).toBeLessThanOrEqual(last)
      last = interval
    }
  })

  it('is shorter the better the aim, down to the center factor', () => {
    const edge = beepIntervalMs(200, 30, radius, tuning)
    expect(beepIntervalMs(200, 0, radius, tuning)).toBeCloseTo(edge * 0.5)
    expect(beepIntervalMs(200, 15, radius, tuning)).toBeCloseTo(edge * 0.75)
    expect(beepIntervalMs(200, -15, radius, tuning)).toBeCloseTo(edge * 0.75)
    expect(beepIntervalMs(200, 40, radius, tuning)).toBeCloseTo(edge)
  })

  it('changes more up close than far away (curve below 1)', () => {
    const close = beepIntervalMs(60, 30, radius, tuning) - beepIntervalMs(10, 30, radius, tuning)
    const far = beepIntervalMs(510, 30, radius, tuning) - beepIntervalMs(460, 30, radius, tuning)
    expect(close).toBeGreaterThan(far)
  })

  it('pulses at the found rate inside the found radius, whichever way the phone points', () => {
    expect(beepIntervalMs(3, 90, radius, tuning)).toBe(250)
    expect(beepIntervalMs(3, 0, radius, tuning)).toBe(250)
  })
})

describe('beepVolume', () => {
  it('is quiet far away and full up close', () => {
    expect(beepVolume(510, radius, tuning)).toBeCloseTo(0.25)
    expect(beepVolume(10, radius, tuning)).toBeCloseTo(1)
  })

  it('only gets louder the closer you get', () => {
    let last = 0
    for (let d = 600; d >= 6; d -= 7) {
      const volume = beepVolume(d, radius, tuning)
      expect(volume).toBeGreaterThanOrEqual(last)
      last = volume
    }
  })

  it('is full inside the found radius', () => {
    expect(beepVolume(3, radius, tuning)).toBe(1)
  })

  it('stays within 0..1', () => {
    for (const d of [0, 3, 10, 100, 510, 5000]) {
      const volume = beepVolume(d, radius, tuning)
      expect(volume).toBeGreaterThanOrEqual(0)
      expect(volume).toBeLessThanOrEqual(1)
    }
  })
})

describe('isBeepAudible', () => {
  it('needs the phone to point at the target', () => {
    expect(isBeepAudible(200, true, radius)).toBe(true)
    expect(isBeepAudible(200, false, radius)).toBe(false)
  })

  it('is always audible inside the found radius', () => {
    expect(isBeepAudible(3, false, radius)).toBe(true)
  })
})

describe('foundRadius', () => {
  it('follows the GPS accuracy within the range', () => {
    expect(foundRadius(12, tuning)).toBe(12)
    expect(foundRadius(1, tuning)).toBe(5)
    expect(foundRadius(80, tuning)).toBe(20)
  })

  it('is the smallest radius while the accuracy is unknown', () => {
    expect(foundRadius(null, tuning)).toBe(5)
  })
})

describe('isFound', () => {
  it('is true inside the radius only', () => {
    expect(isFound(5, 5)).toBe(true)
    expect(isFound(5.1, 5)).toBe(false)
  })
})

describe('formatApproxDistance', () => {
  it('rounds more coarsely the farther away', () => {
    expect(formatApproxDistance(23)).toBe('ca. 25 m')
    expect(formatApproxDistance(137)).toBe('ca. 140 m')
    expect(formatApproxDistance(430)).toBe('ca. 450 m')
    expect(formatApproxDistance(1234)).toBe('ca. 1200 m')
  })

  it('never shows zero', () => {
    expect(formatApproxDistance(0)).toBe('ca. 5 m')
  })
})
