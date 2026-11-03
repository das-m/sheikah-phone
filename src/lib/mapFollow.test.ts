import { describe, expect, it } from 'vitest'
import { nextBearing } from './mapFollow'

describe('nextBearing', () => {
  it('moves a fraction of the way to the target', () => {
    expect(nextBearing(0, 40, 0.25, 1)).toBeCloseTo(10)
  })

  it('takes the short way around 0/360', () => {
    expect(nextBearing(359, 1, 0.5, 0.5)).toBeCloseTo(360)
    expect(nextBearing(1, 359, 0.5, 0.5)).toBeCloseTo(0)
    expect(nextBearing(-170, 170, 0.5, 0.5)).toBeCloseTo(-180)
  })

  it('stays put inside the deadband', () => {
    expect(nextBearing(10, 10.8, 0.5, 1)).toBe(10)
    expect(nextBearing(10, 9.2, 0.5, 1)).toBe(10)
  })

  it('converges on the target', () => {
    let bearing = 300
    for (let i = 0; i < 100; i++) bearing = nextBearing(bearing, 20, 0.15, 1)
    expect(Math.abs(((bearing - 20 + 540) % 360) - 180)).toBeLessThanOrEqual(1)
  })
})
