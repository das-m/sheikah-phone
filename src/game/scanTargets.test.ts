import { describe, expect, it } from 'vitest'
import { findSensor, sensors } from './sensors'
import { aroundCode, findTarget, scanTargets } from './scanTargets'

describe('scanTargets', () => {
  it('has unique ids', () => {
    const ids = scanTargets.map((target) => target.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has short digit-only ids, which keep the QR code at version 1', () => {
    // up to 17 digits fit a version 1 code at error correction H
    for (const { id } of scanTargets) expect(id).toMatch(/^\d{1,17}$/)
  })

  it('numbers the ten targets 01 to 10', () => {
    expect(scanTargets.map((target) => target.id)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10'
    ])
  })
})

describe('sensors', () => {
  it('points every target at an existing sensor event with the same id', () => {
    for (const target of scanTargets) {
      expect(target.action.type).toBe('sensor')
      if (target.action.type === 'sensor') {
        expect(findSensor(target.action.sensorId)?.id).toBe(target.id)
      }
    }
  })

  it('has unique sensor ids and a reason for every unavailable one', () => {
    expect(new Set(sensors.map((s) => s.id)).size).toBe(sensors.length)
    for (const sensor of sensors.filter((s) => s.status === 'unavailable')) {
      expect(sensor.statusText).toBeTruthy()
    }
  })

  it('keeps sensor locations on the globe', () => {
    for (const { location } of sensors) {
      if (!location) continue
      expect(Math.abs(location.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(location.lng)).toBeLessThanOrEqual(180)
    }
  })
})

describe('aroundCode', () => {
  it('frames only a little more than the code by default', () => {
    expect(aroundCode.width).toBeCloseTo(1.35)
    // centered on the code
    expect(aroundCode.x + aroundCode.width / 2).toBeCloseTo(0.5)
    expect(aroundCode.y + aroundCode.height / 2).toBeCloseTo(0.5)
  })
})

describe('findTarget', () => {
  it('finds a target by its bare id', () => {
    expect(findTarget('01')?.id).toBe('01')
  })

  it('keeps leading zeros: 1 is not 01', () => {
    expect(findTarget('1')).toBeNull()
  })

  it('ignores whitespace around the id', () => {
    expect(findTarget(' 02\n')?.id).toBe('02')
  })

  it('ignores foreign and unknown codes', () => {
    expect(findTarget('https://example.com')).toBeNull()
    expect(findTarget('99')).toBeNull()
    expect(findTarget('')).toBeNull()
  })
})
