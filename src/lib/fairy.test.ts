import { describe, expect, it } from 'vitest'
import {
  createViewTransform,
  fairyPlaybackRate,
  fairyPosition,
  fairySpeed,
  focusAngleDeg,
  project,
  viewBasis,
  worldToCamera
} from './fairy'

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

describe('fairySpeed', () => {
  it('stays between standing still and a brisk walk', () => {
    for (let i = 0; i < 6000; i++) {
      const speed = fairySpeed(i * 0.1)
      expect(speed).toBeGreaterThanOrEqual(0)
      expect(speed).toBeLessThan(2)
    }
  })

  it('matches the distance covered', () => {
    const a = fairyPosition(10)
    const b = fairyPosition(10.05)
    expect(fairySpeed(10)).toBeCloseTo(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / 0.05)
  })
})

describe('fairyPlaybackRate', () => {
  it('speeds the sound up with the flight and stays within its range', () => {
    expect(fairyPlaybackRate(0)).toBeCloseTo(3)
    expect(fairyPlaybackRate(1.4)).toBeCloseTo(5)
    expect(fairyPlaybackRate(0.7)).toBeGreaterThan(fairyPlaybackRate(0.3))
    expect(fairyPlaybackRate(5)).toBeCloseTo(5)
    expect(fairyPlaybackRate(-1)).toBeCloseTo(3)
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

  it('handles landscape, where gamma is about -90 (phone upright, top to the left, looking north)', () => {
    // Device x points up, y points west, z points south: the columns of the rotation for these angles.
    const landscape = { alpha: 90, beta: 0, gamma: -90 }
    const ahead = worldToCamera({ x: 0, y: 2, z: 0 }, landscape, 90)
    expect(ahead.x).toBeCloseTo(0)
    expect(ahead.y).toBeCloseTo(0)
    expect(ahead.z).toBeCloseTo(2)
    const east = worldToCamera({ x: 1, y: 0, z: 0 }, landscape, 90)
    expect(east.x).toBeCloseTo(1)
    expect(east.y).toBeCloseTo(0)
    const up = worldToCamera({ x: 0, y: 0, z: 1 }, landscape, 90)
    expect(up.x).toBeCloseTo(0)
    expect(up.y).toBeCloseTo(1)
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

describe('viewBasis', () => {
  it('is right = east, up = up, forward = north for a phone upright and looking north', () => {
    const { right, up, forward } = viewBasis(lookingNorth, 0)
    expect(right.x).toBeCloseTo(1)
    expect(up.z).toBeCloseTo(1)
    expect(forward.y).toBeCloseTo(1)
  })

  it('agrees with worldToCamera: the camera sees a world point at its basis coordinates', () => {
    const orientation = { alpha: 40, beta: 70, gamma: -20 }
    const { right, up, forward } = viewBasis(orientation, 90)
    const p = { x: 1, y: 2, z: 0.5 }
    const camera = worldToCamera(p, orientation, 90)
    expect(camera.x).toBeCloseTo(right.x * p.x + right.y * p.y + right.z * p.z)
    expect(camera.y).toBeCloseTo(up.x * p.x + up.y * p.y + up.z * p.z)
    expect(camera.z).toBeCloseTo(forward.x * p.x + forward.y * p.y + forward.z * p.z)
  })
})

describe('focusAngleDeg', () => {
  const north = { x: 0, y: 1, z: 0 }

  it('is 0 straight ahead, 90 to the side, 180 behind', () => {
    expect(focusAngleDeg(north, { x: 0, y: 2, z: 0 })).toBeCloseTo(0)
    expect(focusAngleDeg(north, { x: 2, y: 0, z: 0 })).toBeCloseTo(90)
    expect(focusAngleDeg(north, { x: 0, y: -1, z: 0 })).toBeCloseTo(180)
  })

  it('is 45 diagonally and does not depend on the distance', () => {
    expect(focusAngleDeg(north, { x: 0, y: 1, z: 1 })).toBeCloseTo(45)
    expect(focusAngleDeg(north, { x: 0, y: 5, z: 5 })).toBeCloseTo(45)
  })

  it('is 180 for the origin', () => {
    expect(focusAngleDeg(north, { x: 0, y: 0, z: 0 })).toBe(180)
  })
})

describe('createViewTransform', () => {
  it('gives the same result as worldToCamera for every point', () => {
    const orientation = { alpha: 40, beta: 70, gamma: -20 }
    const transform = createViewTransform(orientation, 270)
    for (const p of [
      { x: 1, y: 2, z: 0.5 },
      { x: -1.5, y: 0.3, z: -0.4 }
    ]) {
      expect(transform(p)).toEqual(worldToCamera(p, orientation, 270))
    }
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
