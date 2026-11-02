import { describe, expect, it } from 'vitest'
import { findSensor, sensors } from './sensors'
import { aroundCode, cardFrame, findTarget, scanTargets } from './scanTargets'

describe('scanTargets', () => {
  it('has unique ids', () => {
    const ids = scanTargets.map((target) => target.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has short digit-only ids, which keep the QR code at version 1', () => {
    // up to 17 digits fit a version 1 code at error correction H
    for (const { id } of scanTargets) expect(id).toMatch(/^\d{1,17}$/)
  })

  it('numbers the nine targets 01 to 09', () => {
    expect(scanTargets.map((target) => target.id)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09'
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

  it('keeps sensor locations near Ludwigsburg', () => {
    for (const { location } of sensors) {
      if (!location) continue
      expect(location.lat).toBeGreaterThan(48.8)
      expect(location.lat).toBeLessThan(49.0)
      expect(location.lng).toBeGreaterThan(9.0)
      expect(location.lng).toBeLessThan(9.4)
    }
  })
})

describe('frames', () => {
  it('frames a card well beyond its code', () => {
    // a 63.5 x 88 mm card carrying a smaller code: several code widths wide and tall, the code inside the box
    expect(cardFrame.width).toBeGreaterThan(2)
    expect(cardFrame.height).toBeGreaterThan(cardFrame.width)
    expect(cardFrame.x).toBeLessThan(0)
    expect(cardFrame.x + cardFrame.width).toBeGreaterThan(1)
    expect(cardFrame.y).toBeLessThanOrEqual(0)
  })

  it('frames only a little more than the code by default', () => {
    expect(aroundCode.width).toBeCloseTo(1.35)
    // centered on the code
    expect(aroundCode.x + aroundCode.width / 2).toBeCloseTo(0.5)
    expect(aroundCode.y + aroundCode.height / 2).toBeCloseTo(0.5)
  })

  it('gives every target the card frame', () => {
    for (const target of scanTargets) expect(target.frame).toBe(cardFrame)
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
