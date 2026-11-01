import { describe, expect, it } from 'vitest'
import {
  coverMap,
  createTracker,
  homographyMatrix3d,
  mapQuad,
  normalizeCode,
  pickDetection,
  quadArea,
  quadCenter,
  scaleQuad,
  type Point,
  type Quad,
  type ScanDetection
} from './scan'

const square = (x: number, y: number, size: number): Quad => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size }
]

const detection = (value: string, corners: Quad = square(0, 0, 10)): ScanDetection => ({
  value,
  corners
})

/** Applies a column-major matrix3d to a point, the way the browser does (with the perspective divide). */
function applyMatrix3d(m: number[], p: Point): Point {
  const w = m[3] * p.x + m[7] * p.y + m[15]
  return {
    x: (m[0] * p.x + m[4] * p.y + m[12]) / w,
    y: (m[1] * p.x + m[5] * p.y + m[13]) / w
  }
}

describe('normalizeCode', () => {
  it('trims whitespace and keeps the case', () => {
    expect(normalizeCode('  plant-3\n')).toBe('plant-3')
    expect(normalizeCode('Plant-3')).toBe('Plant-3')
  })
})

describe('coverMap', () => {
  it('is the identity for the same size', () => {
    expect(coverMap({ width: 100, height: 50 }, { width: 100, height: 50 })).toEqual({
      scale: 1,
      offsetX: 0,
      offsetY: 0
    })
  })

  it('crops the sides of a video wider than the box', () => {
    // 200x100 video in a 100x100 box: scaled by 1, 50 px cut off on each side
    expect(coverMap({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({
      scale: 1,
      offsetX: -50,
      offsetY: 0
    })
  })

  it('crops top and bottom of a video taller than the box', () => {
    // 100x200 video in a 100x100 box
    expect(coverMap({ width: 100, height: 200 }, { width: 100, height: 100 })).toEqual({
      scale: 1,
      offsetX: 0,
      offsetY: -50
    })
  })

  it('moves video points into the box', () => {
    const map = coverMap({ width: 200, height: 100 }, { width: 400, height: 200 })
    const [a, , c] = mapQuad(square(100, 50, 10), map)
    expect(a).toEqual({ x: 200, y: 100 })
    expect(c).toEqual({ x: 220, y: 120 })
  })
})

describe('quadCenter / scaleQuad', () => {
  it('finds the center', () => {
    expect(quadCenter(square(10, 20, 10))).toEqual({ x: 15, y: 25 })
  })

  it('grows a quad about its center', () => {
    const grown = scaleQuad(square(10, 10, 10), 2)
    expect(grown[0]).toEqual({ x: 5, y: 5 })
    expect(grown[2]).toEqual({ x: 25, y: 25 })
    expect(quadCenter(grown)).toEqual({ x: 15, y: 15 })
  })
})

describe('quadArea / pickDetection', () => {
  it('measures a square', () => {
    expect(quadArea(square(5, 5, 10))).toBe(100)
  })

  it('picks the largest code', () => {
    const near = detection('near', square(0, 0, 40))
    const far = detection('far', square(0, 0, 10))
    expect(pickDetection([far, near])).toBe(near)
    expect(pickDetection([])).toBeNull()
  })
})

describe('homographyMatrix3d', () => {
  it('maps the corners of the box onto the quad', () => {
    const quad: Quad = [
      { x: 100, y: 50 },
      { x: 220, y: 70 },
      { x: 200, y: 190 },
      { x: 90, y: 160 }
    ]
    const m = homographyMatrix3d(quad, 100)!
    const box = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ]
    box.forEach((corner, i) => {
      const mapped = applyMatrix3d(m, corner)
      expect(mapped.x).toBeCloseTo(quad[i].x, 6)
      expect(mapped.y).toBeCloseTo(quad[i].y, 6)
    })
  })

  it('reduces to a translation and scale for an upright square', () => {
    const m = homographyMatrix3d(square(30, 40, 20))!
    expect(applyMatrix3d(m, { x: 0.5, y: 0.5 })).toEqual({ x: 40, y: 50 })
    expect(m[3]).toBeCloseTo(0)
    expect(m[7]).toBeCloseTo(0)
  })

  it('follows a rotated code: the corner order carries the rotation', () => {
    // a code turned a quarter turn clockwise: its top left corner is where the box's top right corner would be
    const turned: Quad = [
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 }
    ]
    const m = homographyMatrix3d(turned)!
    expect(applyMatrix3d(m, { x: 0, y: 0 })).toEqual({ x: 10, y: 0 })
    expect(applyMatrix3d(m, { x: 1, y: 0 })).toEqual({ x: 10, y: 10 })
  })

  it('refuses a degenerate quad', () => {
    const line: Quad = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 }
    ]
    expect(homographyMatrix3d(line)).toBeNull()
  })
})

describe('createTracker', () => {
  it('follows nothing at first', () => {
    expect(createTracker().step(0)).toBeNull()
  })

  it('shows a new code where it was detected', () => {
    const t = createTracker()
    t.update(detection('a', square(10, 10, 10)), 0)
    expect(t.step(0)?.corners[0]).toEqual({ x: 10, y: 10 })
  })

  it('confirms a code after enough consecutive readings', () => {
    const t = createTracker({ frames: 2 })
    t.update(detection('a'), 0)
    expect(t.step(0)?.confirmed).toBe(false)
    t.update(detection('a'), 100)
    expect(t.step(100)?.confirmed).toBe(true)
  })

  it('does not confirm a code that flickers', () => {
    const t = createTracker({ frames: 2 })
    t.update(detection('a'), 0)
    t.update(null, 100)
    t.update(detection('a'), 200)
    expect(t.step(200)?.confirmed).toBe(false)
  })

  it('keeps a confirmed code through a missed reading', () => {
    const t = createTracker({ frames: 2, holdMs: 300 })
    t.update(detection('a'), 0)
    t.update(detection('a'), 100)
    t.update(null, 200)
    expect(t.step(250)?.confirmed).toBe(true)
  })

  it('moves toward the new corners and converges', () => {
    const t = createTracker({ smoothingMs: 100 })
    t.update(detection('a', square(0, 0, 10)), 0)
    t.step(0)
    t.update(detection('a', square(100, 0, 10)), 10)
    const first = t.step(50)!.corners[0].x
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(100)
    t.update(detection('a', square(100, 0, 10)), 60)
    let last = first
    for (let now = 100; now <= 1000; now += 50) {
      t.update(detection('a', square(100, 0, 10)), now)
      last = t.step(now)!.corners[0].x
    }
    expect(last).toBeGreaterThan(first)
    expect(last).toBeCloseTo(100, 0)
  })

  it('holds a lost code for a moment, then drops it', () => {
    const t = createTracker({ holdMs: 300 })
    t.update(detection('a'), 0)
    expect(t.step(250)).not.toBeNull()
    expect(t.step(301)).toBeNull()
    expect(t.step(302)).toBeNull()
  })

  it('starts unconfirmed again when the code comes back after being dropped', () => {
    const t = createTracker({ frames: 2, holdMs: 300 })
    t.update(detection('a'), 0)
    t.update(detection('a'), 100)
    expect(t.step(100)?.confirmed).toBe(true)
    expect(t.step(500)).toBeNull()
    t.update(detection('a'), 600)
    expect(t.step(600)?.confirmed).toBe(false)
  })

  it('switches to another code and starts it unconfirmed', () => {
    const t = createTracker({ frames: 2 })
    t.update(detection('a'), 0)
    t.update(detection('a'), 100)
    t.update(detection('b', square(50, 50, 10)), 200)
    const tracked = t.step(200)!
    expect(tracked.value).toBe('b')
    expect(tracked.confirmed).toBe(false)
    expect(tracked.corners[0]).toEqual({ x: 50, y: 50 })
  })

  it('forgets everything on reset', () => {
    const t = createTracker()
    t.update(detection('a'), 0)
    t.reset()
    expect(t.step(0)).toBeNull()
  })
})
