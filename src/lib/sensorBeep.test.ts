import { describe, expect, it } from 'vitest'
import { beepIntervalMs, beepVolume, isFound, type BeepTuning } from './sensorBeep'

const tuning: BeepTuning = {
  nearMeters: 10,
  farMeters: 510,
  fastIntervalMs: 300,
  slowIntervalMs: 2500,
  curve: 0.6,
  facingIntervalFactor: 0.7,
  farVolume: 0.25,
  nearVolume: 1,
  offCourseVolume: 0.5,
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
    expect(beepVolume(510, true, tuning)).toBeCloseTo(0.25)
    expect(beepVolume(10, true, tuning)).toBeCloseTo(1)
  })

  it('only gets louder the closer you get', () => {
    let last = 0
    for (let d = 600; d >= 6; d -= 7) {
      const volume = beepVolume(d, true, tuning)
      expect(volume).toBeGreaterThanOrEqual(last)
      last = volume
    }
  })

  it('is quieter while the phone points elsewhere', () => {
    expect(beepVolume(200, false, tuning)).toBeCloseTo(beepVolume(200, true, tuning) * 0.5)
  })

  it('is full inside the found radius', () => {
    expect(beepVolume(3, false, tuning)).toBe(1)
  })

  it('stays within 0..1', () => {
    for (const d of [0, 3, 10, 100, 510, 5000]) {
      for (const facing of [true, false]) {
        const volume = beepVolume(d, facing, tuning)
        expect(volume).toBeGreaterThanOrEqual(0)
        expect(volume).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('isFound', () => {
  it('is true inside the radius only', () => {
    expect(isFound(5, tuning)).toBe(true)
    expect(isFound(5.1, tuning)).toBe(false)
  })
})
