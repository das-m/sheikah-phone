import { describe, expect, it } from 'vitest'
import { findTarget, scanTargets } from './scanTargets'

describe('scanTargets', () => {
  it('has unique ids', () => {
    const ids = scanTargets.map((target) => target.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('findTarget', () => {
  it('finds a target by its bare id', () => {
    expect(findTarget('plant-1')?.id).toBe('plant-1')
  })

  it('ignores whitespace around the id', () => {
    expect(findTarget(' plant-2\n')?.id).toBe('plant-2')
  })

  it('ignores foreign and unknown codes', () => {
    expect(findTarget('https://example.com')).toBeNull()
    expect(findTarget('plant-99')).toBeNull()
    expect(findTarget('')).toBeNull()
  })
})
