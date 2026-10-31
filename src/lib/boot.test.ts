import { describe, expect, it } from 'vitest'

import {
  BOOT_TIMING,
  isBootDone,
  shownProgress,
  timeProgress,
  workFraction,
  type GroupProgress,
  type PreloadGroup
} from './boot'

const t = BOOT_TIMING
const groups = (done: number, total = 10): Record<PreloadGroup, GroupProgress> => ({
  fonts: { done, total },
  images: { done, total },
  audio: { done, total },
  modules: { done, total }
})

describe('workFraction', () => {
  it('is 0 before anything is done and 1 when everything is', () => {
    expect(workFraction(groups(0))).toBe(0)
    expect(workFraction(groups(10))).toBe(1)
  })

  it('weights the groups', () => {
    const only = (group: PreloadGroup) => ({ ...groups(0), [group]: { done: 10, total: 10 } })
    expect(workFraction(only('images'))).toBeCloseTo(0.4)
    expect(workFraction(only('fonts'))).toBeCloseTo(0.1)
  })

  it('counts a group without work as done', () => {
    expect(workFraction({ ...groups(10), audio: { done: 0, total: 0 } })).toBe(1)
  })

  it('does not overshoot when more is reported than expected', () => {
    expect(workFraction(groups(25))).toBe(1)
  })
})

describe('timeProgress', () => {
  it('stays at 0 until the bar starts, and is full when it ends', () => {
    expect(timeProgress(0)).toBe(0)
    expect(timeProgress(t.barStartMs)).toBe(0)
    expect(timeProgress((t.barStartMs + t.barEndMs) / 2)).toBeCloseTo(0.5)
    expect(timeProgress(t.barEndMs)).toBe(1)
    expect(timeProgress(60000)).toBe(1)
  })
})

describe('shownProgress', () => {
  it('is never ahead of the real work', () => {
    expect(shownProgress(t.barEndMs, 0.3)).toBe(0.3)
  })

  it('is never ahead of the show, however fast the loading is', () => {
    expect(shownProgress((t.barStartMs + t.barEndMs) / 2, 1)).toBeCloseTo(0.5)
  })

  it('is full at the ceiling, whatever is left to load', () => {
    expect(shownProgress(t.maxMs, 0.1)).toBe(1)
  })
})

describe('isBootDone', () => {
  it('waits for the floor even when the work is done', () => {
    expect(isBootDone(t.minMs - 1, 1)).toBe(false)
    expect(isBootDone(t.minMs, 1)).toBe(true)
  })

  it('waits for the work after the floor', () => {
    expect(isBootDone(t.minMs + 1000, 0.9)).toBe(false)
  })

  it('ends at the ceiling regardless of the work', () => {
    expect(isBootDone(t.maxMs, 0)).toBe(true)
  })
})
