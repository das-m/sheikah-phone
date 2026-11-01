import { describe, expect, it } from 'vitest'
import { createNorthOffsetTracker } from './northOffset'

describe('createNorthOffsetTracker', () => {
  it('is null before the first sample and takes the first one as is', () => {
    const tracker = createNorthOffsetTracker()
    expect(tracker.value).toBeNull()
    tracker.push(100, 40)
    expect(tracker.value).toBeCloseTo(60)
  })

  it('stays put for a constant offset, whatever the heading', () => {
    const tracker = createNorthOffsetTracker()
    for (const relative of [0, 90, 180, 270, 359]) tracker.push(relative + 60, relative)
    expect(tracker.value).toBeCloseTo(60)
  })

  it('wraps around 0/360 instead of averaging to the wrong side', () => {
    const tracker = createNorthOffsetTracker(0.5)
    tracker.push(359, 0)
    tracker.push(1, 0)
    const offset = tracker.value!
    // Between 359 and 1: close to 0, not close to 180.
    expect(Math.min(offset, 360 - offset)).toBeLessThan(5)
  })

  it('smooths a single bad sample instead of jumping to it', () => {
    const tracker = createNorthOffsetTracker(0.05)
    tracker.push(60, 0)
    tracker.push(120, 0)
    expect(tracker.value).toBeCloseTo(63)
  })

  it('forgets on reset', () => {
    const tracker = createNorthOffsetTracker()
    tracker.push(60, 0)
    tracker.reset()
    expect(tracker.value).toBeNull()
  })
})
