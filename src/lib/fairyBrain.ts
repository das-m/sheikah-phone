import { FAIRY_MEAN_RADIUS, fairyPosition, isOnScreen } from './fairy'
import type { Viewport, ViewBasis } from './fairy'
import { angleDifference, normalizeDegrees } from './geo'
import type { Vec3 } from './gesture'

export type FairyPhase = 'swirl' | 'notice' | 'flee' | 'hidden' | 'befriend' | 'guide'
/**
 * `hey`: her call. `burst`: a shower of sparkles. `move`: she is triggered and starts her next movement.
 * `hello`: first contact. `look`: she calls from her hiding place. `alarm`: she was found. `sad`: unused for now.
 * `out`: she flies away. `in`: she appears at her hiding place.
 */
export type FairyEvent =
  'hey' | 'burst' | 'move' | 'hello' | 'look' | 'alarm' | 'sad' | 'in' | 'out'

/** Tunables, see `game/fairy.ts` for what each one does. Seconds, degrees, metres. */
export interface FairyConfig {
  /** She is in focus while she is inside this central share (0..1) of the screen. */
  focusScreenShare: number
  focusSeconds: number
  focusGraceSeconds: number
  /** While she is in focus she gets nervous: her position jitters by about this much (metres). */
  nervousJitterMeters: number
  /** She notices the player: she darts to `noticeNearMeters` in front of the view, then circles the head. */
  noticeSeconds: number
  noticeNearMeters: number
  noticeCircleRadius: number
  noticeCircleTurns: number
  fleeSeconds: number
  fleeRiseMeters: number
  /** Distance of the hiding place in each round; its length is the number of times she has to be found. */
  hideRadii: number[]
  hideBehindSpreadDeg: number
  hideFadeInSeconds: number
  hideFindSeconds: number
  hideGraceSeconds: number
  hideBobMeters: number
  hideLoudness: number
  /** While hiding and not found she calls "look" again every this many seconds. */
  hideLookSeconds: number
  befriendSeconds: number
  befriendEndDistance: number
  guideRadius: number
  guideElevationRad: number
  guideMaxDegPerSecond: number
  guideHeySeconds: number
  guideBobMeters: number
}

export interface BrainInput {
  /** Seconds since the last step. Clamped, so a hidden tab does not make her jump. */
  dt: number
  view: ViewBasis
  /** The screen, as the tangents of its half field of view (`viewportTangents`): where she counts as in focus. */
  viewport: Viewport
  /** Direction to the guide target in the fairy's frame (degrees clockwise from north), or null when unknown. */
  guideAzimuth: number | null
}

export interface BrainOutput {
  /** Metres around the head, x east, y north, z up. */
  position: Vec3
  /** 0..1, fades out when she flies away and in when she hides. */
  alpha: number
  /** Size and brightness multiplier of her glow. */
  glow: number
  /** 0..1 volume of her chime. */
  loudness: number
  /** Her speed in m/s, without the jump when she appears at her hiding place. */
  speed: number
  /** 0..1 progress of the running focus timer (phases 1-3 and the hide and seek). */
  focusProgress: number
  /** 0..1 how worked up she is: little while she floats, a lot while she plays or flies. Drives the sparkle. */
  excitement: number
  /** Whether she is in focus right now (inside the central share of the screen and visible). */
  focused: boolean
  /** 0..1 how nervous she is: it rises while she is in focus, so the event shows in her. */
  nervous: number
  phase: FairyPhase
  /** How often she has been found in the hide and seek so far. */
  finds: number
  events: FairyEvent[]
}

const MAX_DT = 0.1
/** After a jump in the story she glides to her new position instead of snapping to it. */
const BLEND_SECONDS = 0.6
const ZERO: Vec3 = { x: 0, y: 0, z: 0 }

const toRad = Math.PI / 180
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const smooth = (t: number) => {
  const k = clamp(t, 0, 1)
  return k * k * (3 - 2 * k)
}
const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t
})
const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
const scale = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k })
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z

/** A fast, small shiver (9, 13 and 17 Hz mixed per axis) of at most about 1 at time `t` seconds. */
function shiver(t: number): Vec3 {
  const tau = 2 * Math.PI * t
  return {
    x: 0.6 * Math.sin(9 * tau) + 0.4 * Math.sin(17 * tau + 1),
    y: 0.6 * Math.sin(13 * tau + 2) + 0.4 * Math.sin(9 * tau + 3),
    z: 0.6 * Math.sin(17 * tau + 4) + 0.4 * Math.sin(13 * tau)
  }
}

/** Degrees clockwise from north of the horizontal direction of a world vector. */
export function azimuthDeg(v: Vec3): number {
  return normalizeDegrees((Math.atan2(v.x, v.y) * 180) / Math.PI)
}

/** A point `radius` metres away at an azimuth (degrees clockwise from north) and elevation (radians). */
export function sphericalToWorld(azimuth: number, elevation: number, radius: number): Vec3 {
  const az = azimuth * toRad
  const flat = radius * Math.cos(elevation)
  return { x: flat * Math.sin(az), y: flat * Math.cos(az), z: radius * Math.sin(elevation) }
}

/** A small wandering offset of about `meters`, from her own organic path. */
function bob(tau: number, meters: number): Vec3 {
  return scale(fairyPosition(tau * 1.3 + 7), meters / FAIRY_MEAN_RADIUS)
}

/**
 * Where she is around the head while she circles it after the dart, `u` from 0 to 1: one or more turns that start and
 * end in front of the player, first still `near` metres away, then at `circleRadius`. Azimuth is the offset in degrees.
 */
export function noticeOffset(u: number, near: number, circleRadius: number, turns: number) {
  return {
    azimuth: 360 * turns * smooth(u),
    elevation: 0.15 + 0.12 * Math.sin(2 * Math.PI * 2 * u),
    radius: circleRadius + (near - circleRadius) * (1 - smooth(u * 4))
  }
}

/**
 * Where she is relative to the view during the befriending loop, `u` from 0 to 1: a loop that shrinks into a hover
 * `endDistance` metres in front of the player. `forward` is the distance ahead, `right` and `up` the offsets.
 */
export function befriendOffset(u: number, endDistance: number) {
  const k = smooth(u)
  const amplitude = 0.6 * (1 - u)
  return {
    forward: 1.6 + (endDistance - 1.6) * k,
    right: amplitude * Math.sin(2 * Math.PI * 1.5 * u),
    up: 0.1 + amplitude * 0.5 * Math.sin(2 * Math.PI * 3 * u)
  }
}

/**
 * The fairy's story as a state machine, with no browser in it: feed `step` the view each frame, draw what it returns.
 * swirl (watch her for a while) -> notice (she darts to the player and circles the head) -> flee, hidden (three times, closer each time) ->
 * befriend -> guide. `skip` jumps to the next stage and `reset` starts over (for testing).
 */
export function createFairyBrain(config: FairyConfig, rng: () => number = Math.random) {
  let phase: FairyPhase = 'swirl'
  let phaseTime = 0
  /** Her clock for the swirl and the small bobbing. */
  let tau = 0
  /** Time that always runs, for the shivering. */
  let clock = 0
  let finds = 0
  let hold = 0
  let lost = 0
  let excitement = 0.15
  let nervous = 0
  /** She has noticed the player (the first contact was announced). */
  let met = false
  let lookTimer = 0
  /** Where in front of the player she was when she noticed them (azimuth, degrees): the circle starts there. */
  let noticeAzimuth = 0
  let fleeFrom: Vec3 = ZERO
  let anchor: Vec3 = ZERO
  let guideAzimuth: number | null = null
  let heyTimer = 0
  let blendFrom: Vec3 | null = null
  let blendTime = 0
  let position: Vec3 = fairyPosition(0)
  let alpha = 1
  let speed = 0
  let jumped = false
  let skipRequested = false
  let events: FairyEvent[] = []

  function resetHold() {
    hold = 0
    lost = 0
  }

  /** Counts the time she is in focus. Returns true once she has been out of focus for longer than `grace`. */
  function holdStep(focused: boolean, dt: number, grace: number): boolean {
    if (focused) {
      hold += dt
      lost = 0
      return false
    }
    lost += dt
    if (lost > grace) {
      hold = 0
      return true
    }
    return false
  }

  function startBlend() {
    blendFrom = position
    blendTime = 0
  }

  /** The player has watched her long enough: she notices them, gets excited and darts in front of them. */
  function enterNotice(view: ViewBasis) {
    phase = 'notice'
    phaseTime = 0
    resetHold()
    noticeAzimuth = azimuthDeg(view.forward)
    startBlend()
    events.push('hey', 'move')
  }

  /** She flies up and away (she called "hey" when she noticed the player, or the alarm sounded after a find). */
  function startFlee() {
    phase = 'flee'
    phaseTime = 0
    fleeFrom = position
    resetHold()
    events.push('out')
  }

  /** She appears behind the player, at the distance of the current round. */
  function placeHidden(view: ViewBasis) {
    const azimuth = azimuthDeg(view.forward) + 180 + (rng() * 2 - 1) * config.hideBehindSpreadDeg
    const elevation = 0.1 + rng() * 0.4
    const radius = config.hideRadii[Math.min(finds, config.hideRadii.length - 1)]
    anchor = sphericalToWorld(azimuth, elevation, radius)
    phase = 'hidden'
    phaseTime = 0
    lookTimer = 0
    resetHold()
    blendFrom = null
    jumped = true
    events.push('in', 'look')
  }

  function startBefriend() {
    phase = 'befriend'
    phaseTime = 0
    startBlend()
    events.push('move')
  }

  function enterGuide(view: ViewBasis) {
    phase = 'guide'
    phaseTime = 0
    heyTimer = 0
    guideAzimuth = azimuthDeg(view.forward)
    startBlend()
  }

  function reset() {
    phase = 'swirl'
    phaseTime = 0
    tau = 0
    finds = 0
    excitement = 0.15
    nervous = 0
    met = false
    guideAzimuth = null
    blendFrom = null
    resetHold()
    position = fairyPosition(0)
    alpha = 1
    speed = 0
    skipRequested = false
  }

  /** A find in the hide and seek (the alarm sounds): next round, or the friendship once she was found often enough. */
  function completeFind(view: ViewBasis, skipping: boolean) {
    finds += 1
    events.push('alarm')
    if (finds >= config.hideRadii.length) startBefriend()
    else if (skipping) placeHidden(view)
    else startFlee()
  }

  function skipStage(view: ViewBasis) {
    switch (phase) {
      case 'swirl':
        enterNotice(view)
        break
      case 'notice':
      case 'flee':
        placeHidden(view)
        break
      case 'hidden':
        completeFind(view, true)
        break
      case 'befriend':
        enterGuide(view)
        break
      case 'guide':
        reset()
        break
    }
  }

  /** How worked up she wants to be in the current phase; `excitement` eases towards it. */
  function excitementTarget(progress: number): number {
    switch (phase) {
      case 'swirl':
        return 0.15 + 0.45 * nervous + 0.2 * progress
      case 'notice':
      case 'flee':
      case 'befriend':
        return 1
      case 'hidden':
        return 0.3 + 0.3 * nervous + 0.3 * progress
      case 'guide':
        return 0.4
    }
  }

  function step(input: BrainInput): BrainOutput {
    const dt = clamp(input.dt, 0, MAX_DT)
    const { view } = input
    events = []
    if (skipRequested) {
      skipRequested = false
      skipStage(view)
    }
    phaseTime += dt

    // She is in focus while she is on the screen (the camera cannot see her, so she shows it herself: `nervous`).
    const canBeFocused = phase === 'swirl' || phase === 'hidden'
    const onScreen = isOnScreen(
      { x: dot(view.right, position), y: dot(view.up, position), z: dot(view.forward, position) },
      input.viewport,
      config.focusScreenShare
    )
    const focused = canBeFocused && alpha > 0.6 && onScreen
    nervous += ((focused ? 1 : 0) - nervous) * Math.min(1, dt / (focused ? 0.15 : 0.4))
    clock += dt

    let next: Vec3 = position
    let nextAlpha = 1
    let loudness = 1
    let glow = 1
    let progress = 0

    switch (phase) {
      case 'swirl': {
        tau += dt
        // First contact: she notices that the player has her in view.
        if (focused && !met) {
          met = true
          events.push('hello')
        }
        holdStep(focused, dt, config.focusGraceSeconds)
        if (hold >= config.focusSeconds) enterNotice(view)
        progress = hold / config.focusSeconds
        break
      }
      case 'notice': {
        tau += dt
        if (phaseTime >= config.noticeSeconds) startFlee()
        break
      }
      case 'flee': {
        const u = clamp(phaseTime / config.fleeSeconds, 0, 1)
        next = add(fleeFrom, { x: 0, y: 0, z: config.fleeRiseMeters * u * u })
        nextAlpha = 1 - u
        if (u >= 1) placeHidden(view)
        break
      }
      case 'hidden': {
        tau += dt
        holdStep(focused, dt, config.hideGraceSeconds)
        // Not found yet: she calls again now and then, so the player can find her by ear.
        if (focused) lookTimer = 0
        else {
          lookTimer += dt
          if (lookTimer >= config.hideLookSeconds) {
            lookTimer = 0
            events.push('look')
          }
        }
        if (hold >= config.hideFindSeconds) completeFind(view, false)
        progress = hold / config.hideFindSeconds
        loudness = config.hideLoudness
        break
      }
      case 'befriend': {
        const u = clamp(phaseTime / config.befriendSeconds, 0, 1)
        const offset = befriendOffset(u, config.befriendEndDistance)
        const hover = 0.04 * Math.sin(phaseTime * 5)
        next = add(
          add(scale(view.forward, offset.forward), scale(view.right, offset.right)),
          scale(view.up, offset.up + hover)
        )
        glow = 1 + 0.8 * Math.sin(Math.PI * u)
        if (u >= 1) {
          events.push('hey', 'burst')
          enterGuide(view)
        }
        break
      }
      case 'guide': {
        tau += dt
        heyTimer += dt
        if (heyTimer >= config.guideHeySeconds) {
          heyTimer = 0
          events.push('hey')
        }
        glow = 1.1
        break
      }
    }

    // Positions that follow from the (possibly just changed) phase.
    switch (phase) {
      case 'swirl':
        next = fairyPosition(tau)
        glow = 1 + 0.45 * nervous + 0.3 * progress
        break
      case 'notice': {
        // Darts to the player's face (the blend), then circles the head and ends in front of them again.
        const u = clamp((phaseTime - BLEND_SECONDS) / (config.noticeSeconds - BLEND_SECONDS), 0, 1)
        const o = noticeOffset(
          u,
          config.noticeNearMeters,
          config.noticeCircleRadius,
          config.noticeCircleTurns
        )
        next = sphericalToWorld(noticeAzimuth + o.azimuth, o.elevation, o.radius)
        glow = 1.3
        break
      }
      case 'hidden':
        next = add(anchor, bob(tau, config.hideBobMeters))
        nextAlpha = clamp(phaseTime / config.hideFadeInSeconds, 0, 1)
        glow = 1 + 0.45 * nervous + 0.3 * progress
        break
      case 'guide': {
        if (input.guideAzimuth !== null && guideAzimuth !== null) {
          const maxStep = config.guideMaxDegPerSecond * dt
          guideAzimuth = normalizeDegrees(
            guideAzimuth +
              clamp(angleDifference(guideAzimuth, input.guideAzimuth), -maxStep, maxStep)
          )
          next = add(
            sphericalToWorld(guideAzimuth, config.guideElevationRad, config.guideRadius),
            bob(tau, config.guideBobMeters)
          )
        } else {
          // No direction yet (no fix or heading): she stays close and swirls.
          next = scale(fairyPosition(tau), config.guideRadius / FAIRY_MEAN_RADIUS)
        }
        break
      }
    }

    if (blendFrom) {
      blendTime += dt
      const k = smooth(blendTime / BLEND_SECONDS)
      next = lerp(blendFrom, next, k)
      if (k >= 1) blendFrom = null
    }

    if (jumped) jumped = false
    else if (dt > 0)
      speed = Math.hypot(next.x - position.x, next.y - position.y, next.z - position.z) / dt
    position = next
    alpha = nextAlpha

    excitement += (excitementTarget(progress) - excitement) * Math.min(1, dt / 0.3)

    // Nervous she shivers. Only what is drawn shivers: the story and her speed use the calm position.
    const shake = scale(shiver(clock), nervous * config.nervousJitterMeters)

    return {
      position: add(position, shake),
      alpha,
      glow,
      loudness,
      speed,
      focusProgress: clamp(progress, 0, 1),
      excitement,
      focused,
      nervous,
      phase,
      finds,
      events
    }
  }

  return {
    step,
    skip() {
      skipRequested = true
    },
    reset
  }
}

export type FairyBrain = ReturnType<typeof createFairyBrain>
