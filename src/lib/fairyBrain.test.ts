import { describe, expect, it } from 'vitest'
import type { ViewBasis } from './fairy'
import { fairyPosition } from './fairy'
import {
  azimuthDeg,
  befriendOffset,
  createFairyBrain,
  hopOffset,
  sphericalToWorld
} from './fairyBrain'
import type { BrainOutput, FairyBrain, FairyConfig, FairyEvent } from './fairyBrain'
import { angleDifference } from './geo'
import type { Vec3 } from './gesture'

const config: FairyConfig = {
  focusConeDeg: 12,
  focusSeconds: 5,
  focusGraceSeconds: 0.5,
  swirlFocusSlowdown: 0.35,
  escapeSeconds: 5,
  escapeGraceSeconds: 1.5,
  escapeRadius: 1.5,
  escapeElevationRad: 0.2,
  escapeHopMinDeg: 18,
  escapeHopMaxDeg: 30,
  escapeHopMinSeconds: 0.7,
  escapeHopMaxSeconds: 0.9,
  escapeDwellMinSeconds: 0.6,
  escapeDwellMaxSeconds: 1.2,
  escapeFeintChance: 0.3,
  escapeFrontLimitDeg: 50,
  fleeSeconds: 0.8,
  fleeRiseMeters: 8,
  hideRadii: [1.5, 1.2, 0.9],
  hideBehindSpreadDeg: 50,
  hideFadeInSeconds: 0.8,
  hideFindSeconds: 1,
  hideGraceSeconds: 0.3,
  hideBobMeters: 0.12,
  hideLoudness: 0.45,
  befriendSeconds: 5,
  befriendEndDistance: 0.8,
  guideRadius: 1.2,
  guideElevationRad: 0.2,
  guideMaxDegPerSecond: 90,
  guideHeySeconds: 8,
  guideBobMeters: 0.15
}

const DT = 0.05
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
  let out = brain.step({ dt: 0, view: north, guideAzimuth: null })
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
        out = brain.step({ dt: DT, view: viewFor(out), guideAzimuth })
        events.push(...out.events)
      }
      return out
    },
    skip(times = 1) {
      for (let i = 0; i < times; i++) {
        brain.skip()
        out = brain.step({ dt: DT, view: north, guideAzimuth: null })
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
  r.run(5.2, track)
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

  it('turns to the game after the focus was held for long enough, with one "hey"', () => {
    const r = setup()
    expect(r.run(4.8, track).phase).toBe('swirl')
    expect(r.out.focusProgress).toBeGreaterThan(0.9)
    expect(r.run(0.6, track).phase).toBe('escape')
    expect(r.events.filter((e) => e === 'hey')).toHaveLength(1)
  })

  it('forgives a short loss of focus', () => {
    const r = setup()
    r.run(3, track)
    r.run(0.3, away)
    expect(r.run(2.6, track).phase).toBe('escape')
  })

  it('starts the focus time over after a longer loss', () => {
    const r = setup()
    r.run(3, track)
    r.run(1, away)
    expect(r.run(2.6, track).phase).toBe('swirl')
  })
})

describe('escape', () => {
  it('goes back to the swirl when she is lost for longer than the grace time', () => {
    const r = setup()
    r.run(5.2, track)
    expect(r.out.phase).toBe('escape')
    r.run(1, away)
    expect(r.out.phase).toBe('escape')
    expect(r.run(1, away).phase).toBe('swirl')
  })

  /** Plays into the game, then watches her for a minute against a view that stays where it was (she cannot be lost). */
  function watchGame(game: FairyConfig) {
    // Neither lost nor won: the grace time and the time to hold are endless.
    const r = makeRun(
      createFairyBrain({ ...game, escapeGraceSeconds: 1e6, escapeSeconds: 1e6 }, seededRng(3))
    )
    r.run(5.2, track)
    expect(r.out.phase).toBe('escape')
    const view = lookAt(r.out.position)
    const viewAzimuth = azimuthDeg(view.forward)
    const samples: { az: number; speed: number }[] = []
    for (let i = 0; i < 1200; i++) {
      const out = r.run(DT, fixed(view))
      samples.push({ az: azimuthDeg(out.position), speed: 0 })
      if (samples.length > 1) {
        const previous = samples[samples.length - 2].az
        samples[samples.length - 1].speed =
          Math.abs(angleDifference(previous, samples[samples.length - 1].az)) / DT
      }
    }
    return { viewAzimuth, samples }
  }

  it('plays in front of the player: she never leaves the front arc of the view', () => {
    for (const feintChance of [0, 0.3, 1]) {
      const { viewAzimuth, samples } = watchGame({ ...config, escapeFeintChance: feintChance })
      for (const { az } of samples) {
        // A little extra for her bobbing.
        expect(Math.abs(angleDifference(viewAzimuth, az))).toBeLessThanOrEqual(
          config.escapeFrontLimitDeg + 4
        )
      }
    }
  })

  it('hops with pauses in between instead of drifting, at a pace that can be followed', () => {
    const { samples } = watchGame(config)
    const speeds = samples.slice(1).map((s) => s.speed)
    // Peak of a 30 degree smoothstep hop over 0.7 s is about 64 deg/s.
    expect(Math.max(...speeds)).toBeLessThan(75)
    const still = speeds.filter((s) => s < 3).length / speeds.length
    expect(still).toBeGreaterThan(0.25)
    expect(still).toBeLessThan(0.85)
  })

  it('switches side most of the time', () => {
    const { samples } = watchGame({ ...config, escapeFeintChance: 0 })
    // Direction of each hop: the sign of the azimuth change over runs of motion.
    const directions: number[] = []
    let sum = 0
    for (const [i, s] of samples.entries()) {
      if (i > 0 && s.speed >= 3) sum += angleDifference(samples[i - 1].az, s.az)
      else if (sum !== 0) {
        directions.push(Math.sign(sum))
        sum = 0
      }
    }
    let switched = 0
    for (let i = 1; i < directions.length; i++) if (directions[i] !== directions[i - 1]) switched++
    expect(directions.length).toBeGreaterThan(20)
    expect(switched / (directions.length - 1)).toBeGreaterThan(0.5)
  })

  it('flees with a "hey" when she was kept in focus, and fades out', () => {
    const r = setup()
    r.run(5.2, track)
    r.events.length = 0
    r.run(5.2, track)
    expect(r.out.phase).toBe('flee')
    expect(r.events).toContain('hey')
    r.run(0.4, fixed(north))
    expect(r.out.alpha).toBeLessThan(0.7)
    expect(r.out.position.z).toBeGreaterThan(1.5)
  })
})

describe('hopOffset', () => {
  const plain = { feint: false, first: 6, last: 20 }
  const fake = { feint: true, first: 6, last: -16 }

  it('runs smoothly from the start to the target', () => {
    expect(hopOffset(plain, 0)).toBe(0)
    expect(hopOffset(plain, 1)).toBeCloseTo(20)
    expect(hopOffset(plain, 0.5)).toBeCloseTo(10)
    let previous = 0
    for (let u = 0.05; u <= 1; u += 0.05) {
      expect(hopOffset(plain, u)).toBeGreaterThanOrEqual(previous)
      previous = hopOffset(plain, u)
    }
  })

  it('a feint starts towards one side, then turns and goes the other way', () => {
    expect(hopOffset(fake, 0.4)).toBeCloseTo(6)
    expect(hopOffset(fake, 0.2)).toBeGreaterThan(0)
    expect(hopOffset(fake, 0.2)).toBeLessThan(6)
    expect(hopOffset(fake, 0.7)).toBeLessThan(6)
    expect(hopOffset(fake, 1)).toBeCloseTo(-16)
    // It really crosses where she started.
    expect(hopOffset(fake, 0.85)).toBeLessThan(0)
  })

  it('a feint can also end where she started', () => {
    expect(hopOffset({ feint: true, first: 6, last: 0 }, 1)).toBeCloseTo(0)
  })
})

describe('swirl curiosity and excitement', () => {
  it('floats more slowly while she is in focus and speeds up again when she is lost', () => {
    const r = setup()
    r.run(3, track)
    // The swirl clock eases to 0.35 within about a quarter second: about 1.21 s have passed on it.
    expect(length(sub(r.out.position, fairyPosition(1.2125)))).toBeLessThan(0.05)
    r.run(3, away)
    // And back to 1: about 2.84 s more.
    expect(length(sub(r.out.position, fairyPosition(1.2125 + 2.8375)))).toBeLessThan(0.1)
  })

  it('is calm while floating and worked up while playing, flying and befriending', () => {
    const r = setup()
    expect(r.run(4, away).excitement).toBeLessThan(0.25)
    r.skip()
    expect(r.out.phase).toBe('escape')
    expect(r.run(1.5, track).excitement).toBeGreaterThan(0.7)
    r.skip(4)
    expect(r.out.phase).toBe('befriend')
    expect(r.run(1.5, fixed(north)).excitement).toBeGreaterThan(0.85)
    r.skip()
    expect(r.out.phase).toBe('guide')
    expect(Math.abs(r.run(3, fixed(north)).excitement - 0.4)).toBeLessThan(0.05)
  })

  it('reports the angle to her', () => {
    const r = setup()
    expect(r.run(0.5, track).focusAngle).toBeLessThan(5)
    expect(r.run(0.5, away).focusAngle).toBeGreaterThan(170)
  })
})

describe('move events', () => {
  it('sounds when she is triggered into each new movement, and not in between', () => {
    const r = setup()
    r.run(10, away)
    expect(r.events).not.toContain('move')
    r.run(5.2, track)
    expect(r.events.filter((e) => e === 'move')).toHaveLength(1) // escape
    r.run(5.2, track)
    expect(r.events.filter((e) => e === 'move')).toHaveLength(2) // flee
    r.run(0.9, fixed(north))
    expect(r.events.filter((e) => e === 'move')).toHaveLength(3) // she appears behind the player
    r.run(5, fixed(north))
    expect(r.events.filter((e) => e === 'move')).toHaveLength(3)
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
      expect(r.events).toContain('hey')
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
      ['escape', 0],
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
    const before = brain.step({ dt: 0, view: north, guideAzimuth: null }).position
    const after = brain.step({ dt: 5, view: north, guideAzimuth: null }).position
    expect(
      length({ x: after.x - before.x, y: after.y - before.y, z: after.z - before.z })
    ).toBeLessThan(0.3)
  })

  it('goes back to the first phase on reset', () => {
    const brain = createFairyBrain(config, seededRng())
    const r = makeRun(brain)
    r.skip(3)
    brain.reset()
    const out = brain.step({ dt: DT, view: north, guideAzimuth: null })
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
