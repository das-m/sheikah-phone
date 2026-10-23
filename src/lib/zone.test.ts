import { describe, expect, it } from 'vitest'
import { isInsideZone } from './zone'

const zone = { center: { lat: 48.9, lng: 9.19 }, radiusMeters: 40 }
// 0.0001° latitude is about 11.1 m
const at = (meters: number) => ({ lat: zone.center.lat + meters / 111195, lng: zone.center.lng })

describe('isInsideZone', () => {
  it('enters at the radius', () => {
    expect(isInsideZone(at(30), zone, false)).toBe(true)
    expect(isInsideZone(at(50), zone, false)).toBe(false)
  })

  it('stays inside a bit beyond the radius once inside', () => {
    expect(isInsideZone(at(50), zone, true)).toBe(true)
    expect(isInsideZone(at(60), zone, true)).toBe(false)
  })

  it('lets a poor GPS accuracy count in the players favour', () => {
    expect(isInsideZone(at(60), zone, false, 25)).toBe(true)
    expect(isInsideZone(at(60), zone, false, 5)).toBe(false)
  })

  it('caps the credit, so a coarse fix does not unlock the zone from afar', () => {
    expect(isInsideZone(at(500), zone, false, 2000)).toBe(false)
    expect(isInsideZone(at(55), zone, false, 2000)).toBe(true)
  })
})
