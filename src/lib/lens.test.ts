import { describe, expect, it } from 'vitest'
import { createConfirmer, parseToken } from './lens'

describe('parseToken', () => {
  it('parses kind and id', () => {
    expect(parseToken('sheikah:plant:plant-1')).toEqual({ kind: 'plant', id: 'plant-1' })
  })

  it('ignores foreign payloads', () => {
    expect(parseToken('https://example.com')).toBeNull()
    expect(parseToken('')).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(parseToken('sheikah:plant')).toBeNull()
    expect(parseToken('sheikah::x')).toBeNull()
    expect(parseToken('sheikah:plant:a:b')).toBeNull()
  })
})

describe('createConfirmer', () => {
  it('confirms a code after enough consecutive frames', () => {
    const c = createConfirmer({ frames: 2 })
    expect(c.push('a', 0)).toBeNull()
    expect(c.push('a', 250)).toBe('a')
  })

  it('does not count a code that flickers', () => {
    const c = createConfirmer({ frames: 2 })
    expect(c.push('a', 0)).toBeNull()
    expect(c.push(null, 250)).toBeNull()
    expect(c.push('a', 500)).toBeNull()
  })

  it('restarts the streak when the code changes', () => {
    const c = createConfirmer({ frames: 2 })
    c.push('a', 0)
    expect(c.push('b', 250)).toBeNull()
    expect(c.push('b', 500)).toBe('b')
  })

  it('ignores the same code during the cooldown, then fires again', () => {
    const c = createConfirmer({ frames: 1, cooldownMs: 1000 })
    expect(c.push('a', 0)).toBe('a')
    expect(c.push('a', 500)).toBeNull()
    expect(c.push('a', 1000)).toBe('a')
  })

  it('does not block a different code', () => {
    const c = createConfirmer({ frames: 1, cooldownMs: 1000 })
    c.push('a', 0)
    expect(c.push('b', 100)).toBe('b')
  })

  it('forgets everything on reset', () => {
    const c = createConfirmer({ frames: 1, cooldownMs: 1000 })
    c.push('a', 0)
    c.reset()
    expect(c.push('a', 100)).toBe('a')
  })
})
