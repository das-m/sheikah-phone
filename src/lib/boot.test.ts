import { describe, expect, it } from 'vitest'

import {
  BOOT_TIMING,
  isBootDone,
  isFrameDue,
  isLogoDue,
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

describe('isLogoDue', () => {
  it('holds the black screen first, even when the art is ready', () => {
    expect(isLogoDue(t.logoAtMs - 1, true)).toBe(false)
    expect(isLogoDue(t.logoAtMs, true)).toBe(true)
  })

  it('waits for the art after the hold', () => {
    expect(isLogoDue(t.logoAtMs + 500, false)).toBe(false)
  })

  it('stops waiting for the art at the limit', () => {
    expect(isLogoDue(t.logoWaitMaxMs, false)).toBe(true)
  })
})

describe('isFrameDue', () => {
  it('needs the logo first', () => {
    expect(isFrameDue(60000, null)).toBe(false)
  })

  it('follows the logo by its delay', () => {
    expect(isFrameDue(1000 + t.frameAfterLogoMs - 1, 1000)).toBe(false)
    expect(isFrameDue(1000 + t.frameAfterLogoMs, 1000)).toBe(true)
  })
})

describe('isBootDone', () => {
  it('waits for the floor, counted from the logo, even when the work is done', () => {
    expect(isBootDone(1000 + t.minAfterLogoMs - 1, 1000, 1)).toBe(false)
    expect(isBootDone(1000 + t.minAfterLogoMs, 1000, 1)).toBe(true)
  })

  it('waits for the work after the floor', () => {
    expect(isBootDone(1000 + t.minAfterLogoMs + 1000, 1000, 0.9)).toBe(false)
  })

  it('does not end before the logo has ignited', () => {
    expect(isBootDone(t.maxMs - 1, null, 1)).toBe(false)
  })

  it('ends at the ceiling regardless of the work', () => {
    expect(isBootDone(t.maxMs, null, 0)).toBe(true)
  })
})
