import { describe, expect, it } from 'vitest'
import {
  beepIntervalMs,
  beepVolume,
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
  facingIntervalFactor: 0.7,
  farVolume: 0.25,
  nearVolume: 1,
  foundMeters: 5,
  foundIntervalMs: 250
}

describe('beepIntervalMs', () => {
  it('is slow far away and fast up close', () => {
    expect(beepIntervalMs(510, false, tuning)).toBeCloseTo(2500)
    expect(beepIntervalMs(1000, false, tuning)).toBeCloseTo(2500)
    expect(beepIntervalMs(10, false, tuning)).toBeCloseTo(300)
  })

  it('only gets shorter the closer you get', () => {
    let last = Infinity
    for (let d = 600; d >= 6; d -= 7) {
      const interval = beepIntervalMs(d, false, tuning)
      expect(interval).toBeLessThanOrEqual(last)
      last = interval
    }
  })

  it('is shorter while facing the target', () => {
    expect(beepIntervalMs(200, true, tuning)).toBeCloseTo(beepIntervalMs(200, false, tuning) * 0.7)
  })

  it('changes more up close than far away (curve below 1)', () => {
    const close = beepIntervalMs(60, false, tuning) - beepIntervalMs(10, false, tuning)
    const far = beepIntervalMs(510, false, tuning) - beepIntervalMs(460, false, tuning)
    expect(close).toBeGreaterThan(far)
  })

  it('pulses at the found rate inside the found radius, whichever way the phone points', () => {
    expect(beepIntervalMs(3, false, tuning)).toBe(250)
    expect(beepIntervalMs(3, true, tuning)).toBe(250)
  })
})

describe('beepVolume', () => {
  it('is quiet far away and full up close', () => {
    expect(beepVolume(510, tuning)).toBeCloseTo(0.25)
    expect(beepVolume(10, tuning)).toBeCloseTo(1)
  })

  it('only gets louder the closer you get', () => {
    let last = 0
    for (let d = 600; d >= 6; d -= 7) {
      const volume = beepVolume(d, tuning)
      expect(volume).toBeGreaterThanOrEqual(last)
      last = volume
    }
  })

  it('is full inside the found radius', () => {
    expect(beepVolume(3, tuning)).toBe(1)
  })

  it('stays within 0..1', () => {
    for (const d of [0, 3, 10, 100, 510, 5000]) {
      const volume = beepVolume(d, tuning)
      expect(volume).toBeGreaterThanOrEqual(0)
      expect(volume).toBeLessThanOrEqual(1)
    }
  })
})

describe('isBeepAudible', () => {
  it('needs the phone to point at the target', () => {
    expect(isBeepAudible(200, true, tuning)).toBe(true)
    expect(isBeepAudible(200, false, tuning)).toBe(false)
  })

  it('is always audible inside the found radius', () => {
    expect(isBeepAudible(3, false, tuning)).toBe(true)
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

describe('isFound', () => {
  it('is true inside the radius only', () => {
    expect(isFound(5, tuning)).toBe(true)
    expect(isFound(5.1, tuning)).toBe(false)
  })
})
