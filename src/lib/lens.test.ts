import { describe, expect, it } from 'vitest'
import { lensOffset } from './lens'

describe('lensOffset', () => {
  it('shifts right with the camera on the left (90) and left with it on the right (270)', () => {
    expect(lensOffset(90, 0.1)).toBe(0.1)
    expect(lensOffset(270, 0.1)).toBe(-0.1)
  })

  it('does not shift in portrait', () => {
    expect(lensOffset(0, 0.1)).toBe(0)
    expect(lensOffset(180, 0.1)).toBe(0)
  })

  it('understands angles outside 0..359', () => {
    expect(lensOffset(-90, 0.1)).toBe(-0.1)
    expect(lensOffset(450, 0.1)).toBe(0.1)
    expect(lensOffset(360, 0.1)).toBe(0)
  })
})
