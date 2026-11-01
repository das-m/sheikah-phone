import { describe, expect, it } from 'vitest'
import { isRouteAvailable } from './apps'

describe('isRouteAvailable', () => {
  it('only allows an app in its own mode', () => {
    expect(isRouteAvailable('/map', 'sheikah')).toBe(true)
    expect(isRouteAvailable('/map', 'yiga')).toBe(false)
    expect(isRouteAvailable('/yiga', 'yiga')).toBe(true)
    expect(isRouteAvailable('/yiga', 'sheikah')).toBe(false)
    expect(isRouteAvailable('/scanner', 'sheikah')).toBe(true)
    expect(isRouteAvailable('/scanner', 'yiga')).toBe(false)
  })

  it('allows routes outside the registry in every mode', () => {
    expect(isRouteAvailable('/', 'sheikah')).toBe(true)
    expect(isRouteAvailable('/', 'yiga')).toBe(true)
  })
})
