import { describe, expect, it } from 'vitest'
import { createShakeDetector, isFlipped, motionIntensity } from './gesture'

const upright = { x: 0, y: 9.81, z: 0 }
const faceUp = { x: 0, y: 0, z: 9.81 }
const headDown = { x: 0, y: -9.81, z: 0 }

describe('isFlipped', () => {
  it('is true when the top of the phone points down', () => {
    expect(isFlipped(headDown, false)).toBe(true)
  })

  it('is false upright or lying flat', () => {
    expect(isFlipped(upright, false)).toBe(false)
    expect(isFlipped(faceUp, false)).toBe(false)
  })

  it('needs a clear tip to enter and a clear return to leave', () => {
    const tilted = { x: 0, y: -6, z: 7 } // about -0.65 of gravity: not enough to enter
    expect(isFlipped(tilted, false)).toBe(false)
    expect(isFlipped(tilted, true)).toBe(true)
  })

  it('keeps the previous state in free fall', () => {
    expect(isFlipped({ x: 0, y: 0, z: 0 }, true)).toBe(true)
    expect(isFlipped({ x: 0, y: 0, z: 0 }, false)).toBe(false)
  })
})

describe('motionIntensity', () => {
  it('is about zero at rest', () => {
    expect(motionIntensity(upright)).toBeCloseTo(0)
  })
})

describe('createShakeDetector', () => {
  it('fires once on a rapid series of hard peaks', () => {
    const detector = createShakeDetector()
    const fired = [0, 150, 300, 450, 600, 750].map((t) => detector.push(20, t))
    expect(fired.filter(Boolean)).toHaveLength(1)
  })

  it('ignores walking-level motion', () => {
    const detector = createShakeDetector()
    const fired = Array.from({ length: 40 }, (_, i) => detector.push(4, i * 100))
    expect(fired.some(Boolean)).toBe(false)
  })

  it('ignores a single bump and slow peaks', () => {
    const detector = createShakeDetector()
    expect(detector.push(30, 0)).toBe(false)
    const slow = [2000, 3000, 4000, 5000].map((t) => detector.push(20, t))
    expect(slow.some(Boolean)).toBe(false)
  })

  it('can fire again after the cooldown', () => {
    const detector = createShakeDetector()
    const burst = (start: number) =>
      [0, 150, 300, 450].map((d) => detector.push(20, start + d)).some(Boolean)
    expect(burst(0)).toBe(true)
    expect(burst(500)).toBe(false)
    expect(burst(5000)).toBe(true)
  })
})
