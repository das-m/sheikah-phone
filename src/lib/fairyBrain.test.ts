import { describe, expect, it } from 'vitest'
import type { ViewBasis } from './fairy'
import { viewportTangents } from './fairy'
import {
  azimuthDeg,
  befriendOffset,
  createFairyBrain,
  noticeOffset,
  sphericalToWorld
} from './fairyBrain'
import type { BrainOutput, FairyBrain, FairyConfig, FairyEvent } from './fairyBrain'
import { angleDifference } from './geo'
import type { Vec3 } from './gesture'

const config: FairyConfig = {
  focusScreenShare: 0.9,
  nervousJitterMeters: 0.07,
  focusSeconds: 5,
  focusGraceSeconds: 0.5,
  noticeSeconds: 4,
  noticeNearMeters: 0.5,
  noticeCircleRadius: 0.7,
  noticeCircleTurns: 1,
  fleeSeconds: 0.8,
  fleeRiseMeters: 8,
  hideRadii: [1.5, 1.2, 0.9],
  hideBehindSpreadDeg: 50,
  hideFadeInSeconds: 0.8,
  hideFindSeconds: 1,
  hideGraceSeconds: 0.3,
  hideBobMeters: 0.12,
  hideLoudness: 0.45,
  hideLookSeconds: 6,
  befriendSeconds: 5,
  befriendEndDistance: 0.8,
  guideRadius: 1.2,
  guideElevationRad: 0.2,
  guideMaxDegPerSecond: 90,
  guideHeySeconds: 8,
  guideBobMeters: 0.15
}

const DT = 0.05
/** A 2:1 screen with a vertical field of view of 50 degrees, so 43 degrees to the sides and 25 up and down. */
const viewport = viewportTangents(1600, 800, 50)
const length = (v: Vec3) => Math.hypot(v.x, v.y, v.z)
const scale = (v: Vec3, k: number): Vec3 => ({ x: v.x * k, y: v.y * k, z: v.z * k })
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })

/** A view looking at `target` with the horizon level. */
function lookAt(target: Vec3): ViewBasis {
  const l = length(target)
  const forward = scale(target, 1 / l)
  const rawRight = { x: forward.y, y: -forward.x, z: 0 } // forward x up
  const r = Math.hypot(rawRight.x, rawRight.y) || 1
  const right = scale(rawRight, 1 / r)
  const up = {
    x: right.y * forward.z - right.z * forward.y,
    y: right.z * forward.x - right.x * forward.z,
    z: right.x * forward.y - right.y * forward.x
  }
  return { right, up, forward }
}

const north = lookAt({ x: 0, y: 1, z: 0 })
const track = (out: BrainOutput) => lookAt(out.position)
const away = (out: BrainOutput) => lookAt(scale(out.position, -1))
const fixed = (view: ViewBasis) => () => view

/** Steps the brain for `seconds`, the view chosen from the last output; collects the events on the way. */
function makeRun(brain: FairyBrain) {
  let out = brain.step({ dt: 0, view: north, viewport, guideAzimuth: null })
  const events: FairyEvent[] = []
  return {
    get out() {
      return out
    },
    events,
    run(
      seconds: number,
      viewFor: (out: BrainOutput) => ViewBasis,
      guideAzimuth: number | null = null
    ) {
      for (let i = 0; i < Math.round(seconds / DT); i++) {
        out = brain.step({ dt: DT, view: viewFor(out), viewport, guideAzimuth })
        events.push(...out.events)
      }
      return out
    },
    skip(times = 1) {
      for (let i = 0; i < times; i++) {
        brain.skip()
        out = brain.step({ dt: DT, view: north, viewport, guideAzimuth: null })
        events.push(...out.events)
      }
      return out
    }
  }
}

function seededRng(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function setup() {
  return makeRun(createFairyBrain(config, seededRng()))
}

/** Plays through to the first hiding place, looking north when she flees so she hides behind the player. */
function toFirstHide(r: ReturnType<typeof makeRun>) {
  r.run(5.2, track)
  r.run(4.1, track)
  r.run(0.9, fixed(north))
}

describe('swirl and focus', () => {
  it('keeps swirling at the base distance while the player looks elsewhere', () => {
    const r = setup()
    for (let i = 0; i < 600; i++) {
      const out = r.run(0.05, away)
      expect(out.phase).toBe('swirl')
      expect(length(out.position)).toBeGreaterThan(1)
      expect(length(out.position)).toBeLessThan(2)
    }
  })

  it('notices the player after the focus was held for long enough, with one "hey"', () => {
    const r = setup()
    expect(r.run(4.8, track).phase).toBe('swirl')
    expect(r.out.focusProgress).toBeGreaterThan(0.9)
    expect(r.run(0.6, track).phase).toBe('notice')
    expect(r.events.filter((e) => e === 'hey')).toHaveLength(1)
  })

  it('forgives a short loss of focus', () => {
    const r = setup()
    r.run(3, track)
    r.run(0.3, away)
    expect(r.run(2.6, track).phase).toBe('notice')
  })

  it('starts the focus time over after a longer loss', () => {
    const r = setup()
    r.run(3, track)
    r.run(1, away)
    expect(r.run(2.6, track).phase).toBe('swirl')
  })
})

describe('notice', () => {
  /** Plays up to the moment she notices the player and returns the run, the view fixed where she was. */
  function noticed() {
    const r = setup()
    r.run(5.2, track)
    expect(r.out.phase).toBe('notice')
    return r
  }

  it('darts up close in front of the player, whatever the view does', () => {
    const r = noticed()
    const view = lookAt(r.out.position)
    r.run(0.9, fixed(view))
    expect(dot(r.out.position, view.forward)).toBeGreaterThan(0.3)
    expect(length(r.out.position)).toBeLessThan(config.noticeNearMeters + 0.3)
  })

  it('circles the head all the way round and stays close', () => {
    const r = noticed()
    const view = lookAt(r.out.position)
    const start = azimuthDeg(view.forward)
    let travelled = 0
    let previous = azimuthDeg(r.out.position)
    let maxRadius = 0
    for (let i = 0; i < 70; i++) {
      const out = r.run(DT, fixed(view))
      if (out.phase !== 'notice') break
      const az = azimuthDeg(out.position)
      travelled += angleDifference(previous, az)
      previous = az
      maxRadius = Math.max(maxRadius, length(out.position))
    }
    expect(Math.abs(travelled)).toBeGreaterThan(300)
    expect(maxRadius).toBeLessThan(1.5)
    expect(Math.abs(angleDifference(start, previous))).toBeLessThan(40)
  })

  it('does not depend on the player keeping her in focus', () => {
    const r = noticed()
    expect(r.run(3, away).phase).toBe('notice')
  })

  it('then flees without another "hey" and hides', () => {
    const r = noticed()
    r.events.length = 0
    r.run(4, track)
    expect(r.out.phase).toBe('flee')
    expect(r.events).toContain('out')
    expect(r.events).not.toContain('hey')
    r.run(0.4, fixed(north))
    expect(r.out.alpha).toBeLessThan(0.7)
    expect(r.out.position.z).toBeGreaterThan(1.5)
    r.run(0.6, fixed(north))
    expect(r.out.phase).toBe('hidden')
  })
})

describe('noticeOffset', () => {
  it('starts and ends in front and does the turns in between', () => {
    expect(noticeOffset(0, 0.5, 0.7, 1).azimuth).toBeCloseTo(0)
    expect(noticeOffset(1, 0.5, 0.7, 1).azimuth).toBeCloseTo(360)
    expect(noticeOffset(0.5, 0.5, 0.7, 1).azimuth).toBeCloseTo(180)
  })

  it('moves from the near distance out to the circle radius', () => {
    expect(noticeOffset(0, 0.5, 0.7, 1).radius).toBeCloseTo(0.5)
    expect(noticeOffset(1, 0.5, 0.7, 1).radius).toBeCloseTo(0.7)
  })
})

describe('excitement', () => {
  it('is calm while floating and worked up while noticing, flying and befriending', () => {
    const r = setup()
    expect(r.run(4, away).excitement).toBeLessThan(0.25)
    r.skip()
    expect(r.out.phase).toBe('notice')
    expect(r.run(1.5, track).excitement).toBeGreaterThan(0.7)
    r.skip(4)
    expect(r.out.phase).toBe('befriend')
    expect(r.run(1.5, fixed(north)).excitement).toBeGreaterThan(0.85)
    r.skip()
    expect(r.out.phase).toBe('guide')
    expect(Math.abs(r.run(3, fixed(north)).excitement - 0.4)).toBeLessThan(0.05)
  })
})

describe('focus on the whole screen', () => {
  /** A view that keeps her `degrees` to the right of the middle, at her height. */
  const beside = (degrees: number) => (out: BrainOutput) =>
    lookAt(
      sphericalToWorld(
        azimuthDeg(out.position) - degrees,
        Math.asin(out.position.z / length(out.position)),
        1
      )
    )

  it('counts while she is anywhere on the screen, not only in the middle', () => {
    const r = setup()
    r.run(5.5, beside(25))
    expect(r.out.phase).toBe('notice')
  })

  it('does not count when she is outside of the screen', () => {
    const r = setup()
    expect(r.run(10, beside(60)).phase).toBe('swirl')
    expect(r.out.focusProgress).toBe(0)
    expect(r.out.focused).toBe(false)
  })

  it('reports whether she is in focus', () => {
    const r = setup()
    expect(r.run(0.5, track).focused).toBe(true)
    expect(r.run(0.5, away).focused).toBe(false)
  })
})

describe('nervous', () => {
  it('rises while she is in focus and settles when she is not', () => {
    const r = setup()
    expect(r.run(0.2, away).nervous).toBeLessThan(0.05)
    expect(r.run(1, track).nervous).toBeGreaterThan(0.9)
    expect(r.run(1.5, away).nervous).toBeLessThan(0.1)
  })

  it('makes her shiver, but only what is drawn: her speed stays that of the calm path', () => {
    const stepLength = (view: (out: BrainOutput) => ViewBasis) => {
      const r = setup()
      r.run(1, view)
      let previous = r.out.position
      let total = 0
      let maxSpeed = 0
      for (let i = 0; i < 40; i++) {
        const out = r.run(DT, view)
        total += length(sub(out.position, previous))
        maxSpeed = Math.max(maxSpeed, out.speed)
        previous = out.position
      }
      return { average: total / 40, maxSpeed }
    }
    const calm = stepLength(away)
    const nervous = stepLength(track)
    expect(nervous.average).toBeGreaterThan(2 * calm.average)
    expect(nervous.maxSpeed).toBeLessThan(2)
  })

  it('is more worked up and brighter while she is in focus', () => {
    const calm = setup()
    const caught = setup()
    expect(caught.run(2, track).excitement).toBeGreaterThan(calm.run(2, away).excitement + 0.2)
    expect(caught.out.glow).toBeGreaterThan(calm.out.glow)
  })
})

describe('voices', () => {
  it('says hello once, the first time she is in focus', () => {
    const r = setup()
    r.run(3, away)
    expect(r.events).not.toContain('hello')
    r.run(0.5, track)
    expect(r.events.filter((e) => e === 'hello')).toHaveLength(1)
    r.run(2, away)
    r.run(1, track)
    expect(r.events.filter((e) => e === 'hello')).toHaveLength(1)
  })

  it('calls "look" when she hides and again every few seconds until she is found', () => {
    const r = setup()
    toFirstHide(r)
    expect(r.events.filter((e) => e === 'look')).toHaveLength(1)
    r.run(13, fixed(north))
    expect(r.events.filter((e) => e === 'look')).toHaveLength(3)
  })

  it('sounds the alarm at each of the three finds, and no "hey" after them', () => {
    const r = setup()
    toFirstHide(r)
    r.events.length = 0
    for (let round = 0; round < 3; round++) {
      r.run(3, (out) => (out.phase === 'hidden' ? track(out) : north))
      if (round < 2) r.run(1, fixed(north))
    }
    expect(r.out.phase).toBe('befriend')
    expect(r.events.filter((e) => e === 'alarm')).toHaveLength(3)
    expect(r.events).not.toContain('hey')
  })

  it('calls "hey" once when she notices the player, and the alarm is not for that', () => {
    const r = setup()
    r.run(5.2, track)
    r.run(4.1, track)
    expect(r.events.filter((e) => e === 'hey')).toHaveLength(1)
    expect(r.events).not.toContain('alarm')
  })
})

describe('move events', () => {
  it('sounds when she is triggered into each new movement, and not in between', () => {
    const r = setup()
    const count = (event: FairyEvent) => r.events.filter((e) => e === event).length
    r.run(10, away)
    expect([count('move'), count('in'), count('out')]).toEqual([0, 0, 0])
    r.run(5.2, track)
    expect(count('move')).toBe(1) // she notices the player
    r.run(4.1, track)
    expect(count('out')).toBe(1) // she flies away
    r.run(0.9, fixed(north))
    expect(count('in')).toBe(1) // she appears behind the player
    r.run(5, fixed(north))
    expect([count('move'), count('in'), count('out')]).toEqual([1, 1, 1])
  })

  it('also sounds when the friendship starts', () => {
    const r = setup()
    r.skip(4)
    r.events.length = 0
    r.skip()
    expect(r.out.phase).toBe('befriend')
    expect(r.events).toContain('move')
  })
})

describe('hide and seek', () => {
  it('hides behind the player, quietly, and fades in', () => {
    const r = setup()
    toFirstHide(r)
    expect(r.out.phase).toBe('hidden')
    expect(Math.abs(angleDifference(0, azimuthDeg(r.out.position)))).toBeGreaterThan(120)
    expect(r.out.loudness).toBe(config.hideLoudness)
    r.run(1, fixed(north))
    expect(r.out.alpha).toBe(1)
  })

  it('is not found by looking the other way', () => {
    const r = setup()
    toFirstHide(r)
    expect(r.run(10, fixed(north)).phase).toBe('hidden')
    expect(r.out.finds).toBe(0)
  })

  it('is found after one second in focus and then hides again, closer each time', () => {
    const r = setup()
    toFirstHide(r)
    const radii: number[] = []
    for (let round = 0; round < 2; round++) {
      r.run(1, fixed(north))
      radii.push(length(r.out.position))
      r.events.length = 0
      r.run(3, (out) => (out.phase === 'hidden' ? track(out) : north))
      expect(r.events).toContain('alarm')
      expect(r.out.finds).toBe(round + 1)
      r.run(1, fixed(north))
    }
    r.run(1, fixed(north))
    radii.push(length(r.out.position))
    expect(r.out.phase).toBe('hidden')
    expect(radii[0]).toBeCloseTo(1.5, 0)
    expect(radii[1]).toBeCloseTo(1.2, 0)
    expect(radii[2]).toBeCloseTo(0.9, 0)
    expect(radii[0]).toBeGreaterThan(radii[1])
    expect(radii[1]).toBeGreaterThan(radii[2])
  })
})

describe('befriending and guiding', () => {
  function toBefriend() {
    const r = setup()
    toFirstHide(r)
    for (let round = 0; round < 3; round++) {
      r.run(3, (out) => (out.phase === 'hidden' ? track(out) : north))
      if (round < 2) r.run(1, fixed(north))
    }
    return r
  }

  it('starts the friendship after the third find, in front of the view', () => {
    const r = toBefriend()
    expect(r.out.phase).toBe('befriend')
    expect(r.out.finds).toBe(3)
    r.run(2, fixed(north))
    expect(dot(r.out.position, north.forward)).toBeGreaterThan(0.5)
  })

  it('ends in a "hey" and a burst, then turns into the guide', () => {
    const r = toBefriend()
    r.events.length = 0
    r.run(config.befriendSeconds + 0.5, fixed(north))
    expect(r.out.phase).toBe('guide')
    expect(r.events).toContain('hey')
    expect(r.events).toContain('burst')
  })

  it('follows the loop shape: it comes closer and settles', () => {
    const start = befriendOffset(0, 0.8)
    const end = befriendOffset(1, 0.8)
    expect(start.forward).toBeCloseTo(1.6)
    expect(end.forward).toBeCloseTo(0.8)
    expect(end.right).toBeCloseTo(0, 5)
    expect(befriendOffset(0.5, 0.8).forward).toBeLessThan(start.forward)
    expect(befriendOffset(0.5, 0.8).forward).toBeGreaterThan(end.forward)
  })

  it('points the way: she settles at the guide azimuth, turning at a limited rate', () => {
    const r = setup()
    r.skip(6)
    expect(r.out.phase).toBe('guide')
    r.run(0.5, fixed(north), 90)
    expect(Math.abs(angleDifference(0, azimuthDeg(r.out.position)))).toBeLessThan(60)
    r.run(5, fixed(north), 90)
    expect(Math.abs(angleDifference(90, azimuthDeg(r.out.position)))).toBeLessThan(15)
    expect(length(r.out.position)).toBeGreaterThan(1)
    expect(length(r.out.position)).toBeLessThan(1.5)
  })

  it('calls "hey" now and then while guiding', () => {
    const r = setup()
    r.skip(6)
    r.events.length = 0
    r.run(20, fixed(north), 90)
    expect(r.events.filter((e) => e === 'hey').length).toBeGreaterThanOrEqual(2)
  })

  it('stays close and keeps swirling when the direction is unknown', () => {
    const r = setup()
    r.skip(6)
    for (let i = 0; i < 200; i++) {
      const out = r.run(DT, fixed(north), null)
      expect(out.phase).toBe('guide')
      expect(length(out.position)).toBeLessThan(1.6)
    }
  })
})

describe('skip, reset and robustness', () => {
  it('skips through the stages in order and starts over at the end', () => {
    const r = setup()
    const seen = []
    for (let i = 0; i < 7; i++) {
      r.skip()
      seen.push([r.out.phase, r.out.finds])
    }
    expect(seen).toEqual([
      ['notice', 0],
      ['hidden', 0],
      ['hidden', 1],
      ['hidden', 2],
      ['befriend', 3],
      ['guide', 3],
      ['swirl', 0]
    ])
  })

  it('does not jump when the page was hidden for a long time', () => {
    const brain = createFairyBrain(config, seededRng())
    const before = brain.step({ dt: 0, view: north, viewport, guideAzimuth: null }).position
    const after = brain.step({ dt: 5, view: north, viewport, guideAzimuth: null }).position
    expect(
      length({ x: after.x - before.x, y: after.y - before.y, z: after.z - before.z })
    ).toBeLessThan(0.3)
  })

  it('goes back to the first phase on reset', () => {
    const brain = createFairyBrain(config, seededRng())
    const r = makeRun(brain)
    r.skip(3)
    brain.reset()
    const out = brain.step({ dt: DT, view: north, viewport, guideAzimuth: null })
    expect(out.phase).toBe('swirl')
    expect(out.finds).toBe(0)
  })
})

describe('helpers', () => {
  it('reads the compass azimuth of a vector', () => {
    expect(azimuthDeg({ x: 0, y: 1, z: 0 })).toBeCloseTo(0)
    expect(azimuthDeg({ x: 1, y: 0, z: 0 })).toBeCloseTo(90)
    expect(azimuthDeg({ x: 0, y: -1, z: 0 })).toBeCloseTo(180)
    expect(azimuthDeg({ x: -1, y: 0, z: 0 })).toBeCloseTo(270)
  })

  it('builds points by azimuth, elevation and radius', () => {
    const p = sphericalToWorld(90, 0, 2)
    expect(p.x).toBeCloseTo(2)
    expect(p.y).toBeCloseTo(0)
    expect(sphericalToWorld(0, Math.PI / 2, 2).z).toBeCloseTo(2)
  })
})
