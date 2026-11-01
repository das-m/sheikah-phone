import { describe, expect, it } from 'vitest'
import { fairyPosition, project, worldToCamera } from './fairy'

// Phone held upright in portrait, back camera looking north.
const lookingNorth = { alpha: 0, beta: 90, gamma: 0 }
const flat = { alpha: 0, beta: 0, gamma: 0 }

describe('fairyPosition', () => {
  const samples = Array.from({ length: 6000 }, (_, i) => fairyPosition(i * 0.02))

  it('stays 1.1 to 1.9 m from the head and near eye level', () => {
    for (const p of samples) {
      const radius = Math.hypot(p.x, p.y, p.z)
      expect(radius).toBeGreaterThan(1.1 - 1e-9)
      expect(radius).toBeLessThan(1.9 + 1e-9)
      const elevation = Math.asin(p.z / radius)
      expect(elevation).toBeGreaterThan(-0.1)
      expect(elevation).toBeLessThan(0.7)
    }
  })

  it('moves smoothly', () => {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1]
      const b = samples[i]
      expect(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)).toBeLessThan(0.1)
    }
  })

  it('passes through every direction around the user', () => {
    expect(samples.some((p) => p.x > 1)).toBe(true)
    expect(samples.some((p) => p.x < -1)).toBe(true)
    expect(samples.some((p) => p.y > 1)).toBe(true)
    expect(samples.some((p) => p.y < -1)).toBe(true)
  })

  it('is deterministic', () => {
    expect(fairyPosition(12.3)).toEqual(fairyPosition(12.3))
  })
})

describe('worldToCamera', () => {
  it('puts what is ahead in front, east on the right and up on top (phone upright, looking north)', () => {
    const ahead = worldToCamera({ x: 0, y: 2, z: 0 }, lookingNorth, 0)
    expect(ahead.x).toBeCloseTo(0)
    expect(ahead.y).toBeCloseTo(0)
    expect(ahead.z).toBeCloseTo(2)
    expect(worldToCamera({ x: 1, y: 0, z: 0 }, lookingNorth, 0).x).toBeCloseTo(1)
    expect(worldToCamera({ x: 0, y: 0, z: 1 }, lookingNorth, 0).y).toBeCloseTo(1)
  })

  it('puts what is behind at negative depth', () => {
    expect(worldToCamera({ x: 0, y: -2, z: 0 }, lookingNorth, 0).z).toBeCloseTo(-2)
  })

  it('turns with the compass heading', () => {
    // alpha is the counter-clockwise turn from north: at 90 the phone looks west.
    const west = { alpha: 90, beta: 90, gamma: 0 }
    const ahead = worldToCamera({ x: -2, y: 0, z: 0 }, west, 0)
    expect(ahead.z).toBeCloseTo(2)
    expect(ahead.x).toBeCloseTo(0)
  })

  it('looks straight down when the phone lies flat', () => {
    const below = worldToCamera({ x: 0, y: 0, z: -1 }, flat, 0)
    expect(below.x).toBeCloseTo(0)
    expect(below.y).toBeCloseTo(0)
    expect(below.z).toBeCloseTo(1)
  })

  it('swaps the screen axes with the screen rotation', () => {
    const east = { x: 1, y: 0, z: 0 }
    const right = worldToCamera(east, lookingNorth, 0)
    const rotated = worldToCamera(east, lookingNorth, 90)
    expect(right.x).toBeCloseTo(1)
    expect(rotated.x).toBeCloseTo(0)
    expect(rotated.y).toBeCloseTo(1)
    expect(worldToCamera(east, lookingNorth, 180).x).toBeCloseTo(-1)
    expect(worldToCamera(east, lookingNorth, 270).y).toBeCloseTo(-1)
  })
})

describe('project', () => {
  it('puts the view axis in the centre', () => {
    const p = project({ x: 0, y: 0, z: 2 }, 800, 400)
    expect(p).toMatchObject({ x: 400, y: 200, scale: 0.5 })
  })

  it('maps the vertical field of view onto the screen height', () => {
    const top = project({ x: 0, y: Math.tan(Math.PI / 6), z: 1 }, 800, 400, 60)
    expect(top?.y).toBeCloseTo(0)
  })

  it('moves right-hand points right and high points up', () => {
    const p = project({ x: 0.2, y: 0.2, z: 1 }, 800, 400)
    expect(p!.x).toBeGreaterThan(400)
    expect(p!.y).toBeLessThan(200)
  })

  it('returns null behind the camera', () => {
    expect(project({ x: 0, y: 0, z: -1 }, 800, 400)).toBeNull()
    expect(project({ x: 0, y: 0, z: 0 }, 800, 400)).toBeNull()
  })
})
