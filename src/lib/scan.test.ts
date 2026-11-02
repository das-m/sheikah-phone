import { describe, expect, it } from 'vitest'
import {
  boxFromLayout,
  boxQuad,
  coverMap,
  createFailureCounter,
  createTracker,
  homographyMatrix3d,
  mapQuad,
  normalizeCode,
  pickDetection,
  quadArea,
  quadCenter,
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

describe('quadCenter', () => {
  it('finds the center', () => {
    expect(quadCenter(square(10, 20, 10))).toEqual({ x: 15, y: 20 + 5 })
  })
})

describe('boxQuad', () => {
  it('maps a box around an upright code by plain scaling', () => {
    // a 10 px code at (10, 10); a box from -1 to 2 code widths on both axes reaches from (0, 0) to (30, 30)
    const q = boxQuad(square(10, 10, 10), { x: -1, y: -1, width: 3, height: 3 })!
    expect(q[0]).toEqual({ x: 0, y: 0 })
    expect(q[1]).toEqual({ x: 30, y: 0 })
    expect(q[2]).toEqual({ x: 30, y: 30 })
    expect(q[3]).toEqual({ x: 0, y: 30 })
  })

  it('is the code itself for the unit box', () => {
    const quad: Quad = [
      { x: 100, y: 50 },
      { x: 220, y: 70 },
      { x: 200, y: 190 },
      { x: 90, y: 160 }
    ]
    const q = boxQuad(quad, { x: 0, y: 0, width: 1, height: 1 })!
    q.forEach((p, i) => {
      expect(p.x).toBeCloseTo(quad[i].x, 6)
      expect(p.y).toBeCloseTo(quad[i].y, 6)
    })
  })

  it('follows the rotation of the code: a card below the code is below it in the code, not on screen', () => {
    // the code turned half a turn (its corners in the opposite order on screen): "below the code" is now above it
    const turned: Quad = [
      { x: 20, y: 20 },
      { x: 10, y: 20 },
      { x: 10, y: 10 },
      { x: 20, y: 10 }
    ]
    const q = boxQuad(turned, { x: 0, y: 1, width: 1, height: 2 })!
    expect(q[0]).toEqual({ x: 20, y: 10 })
    expect(q[2]).toEqual({ x: 10, y: -10 })
  })

  it('keeps the perspective: the nearer part of a bigger box grows faster than plain scaling', () => {
    // a code twice as wide at the bottom (nearer) as at the top
    const quad: Quad = [
      { x: 45, y: 0 },
      { x: 55, y: 0 },
      { x: 60, y: 10 },
      { x: 40, y: 10 }
    ]
    // 1.5 code heights down: the width there is 1 / (1 - 0.5 * 1.5) = 4x the top, the row is at y = 30 (not 15)
    const q = boxQuad(quad, { x: 0, y: 0, width: 1, height: 1.5 })!
    expect(q[3].x).toBeCloseTo(30, 6)
    expect(q[3].y).toBeCloseTo(30, 6)
    expect(q[2].x).toBeCloseTo(70, 6)
    expect(q[2].y).toBeCloseTo(30, 6)
  })

  it('refuses a degenerate quad', () => {
    const line: Quad = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 }
    ]
    expect(boxQuad(line, { x: 0, y: 0, width: 1, height: 1 })).toBeNull()
  })
})

describe('boxFromLayout', () => {
  const card = { width: 63.5, height: 88 }

  it('centers the code on the card and measures everything in code widths', () => {
    const box = boxFromLayout({ card, codeSize: 15, codeTop: 5 })
    expect(box.width).toBeCloseTo(63.5 / 15)
    expect(box.height).toBeCloseTo(88 / 15)
    expect(box.y).toBeCloseTo(-5 / 15)
    // the same distance from the code to the card's left and right edge
    expect(-box.x).toBeCloseTo(box.x + box.width - 1)
  })

  it('puts the card edges where they are in millimetres', () => {
    const box = boxFromLayout({ card, codeSize: 20, codeTop: 4 })
    // left edge of the card: (63.5 - 20) / 2 = 21.75 mm left of the code
    expect(box.x * 20).toBeCloseTo(-21.75)
    // bottom edge: 88 - 4 = 84 mm below the code's top
    expect((box.y + box.height) * 20).toBeCloseTo(84)
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

  it('keeps following the current code while it is in view, even when another one is larger', () => {
    const a = detection('a', square(0, 0, 20))
    const b = detection('b', square(0, 0, 21))
    expect(pickDetection([a, b], 'a')).toBe(a)
    expect(pickDetection([a, b], 'b')).toBe(b)
  })

  it('falls back to the largest when the current code is gone', () => {
    const a = detection('a', square(0, 0, 20))
    const b = detection('b', square(0, 0, 21))
    expect(pickDetection([a, b], 'gone')).toBe(b)
    expect(pickDetection([a, b], null)).toBe(b)
  })
})

describe('createFailureCounter', () => {
  it('trips after the given number of failures in a row', () => {
    const counter = createFailureCounter(3)
    expect(counter.fail()).toBe(false)
    expect(counter.fail()).toBe(false)
    expect(counter.fail()).toBe(true)
  })

  it('starts over after a success', () => {
    const counter = createFailureCounter(2)
    counter.fail()
    counter.ok()
    expect(counter.fail()).toBe(false)
    expect(counter.fail()).toBe(true)
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

  it('smooths more for a bigger frame', () => {
    const run = (frameWidth: number) => {
      const t = createTracker({ smoothingMs: 100 })
      t.update(detection('a', square(0, 0, 10)), 0)
      t.step(0, frameWidth)
      t.update(detection('a', square(100, 0, 10)), 10)
      return t.step(60, frameWidth)!.corners[0].x
    }
    expect(run(4)).toBeLessThan(run(1))
    // a frame no bigger than the code smooths as before
    expect(run(0.5)).toBeCloseTo(run(1))
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

  it('reports the value being followed', () => {
    const t = createTracker({ holdMs: 300 })
    expect(t.value).toBeNull()
    t.update(detection('a'), 0)
    expect(t.value).toBe('a')
    t.step(400)
    expect(t.value).toBeNull()
  })
})
