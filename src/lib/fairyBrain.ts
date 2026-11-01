import { FAIRY_MEAN_RADIUS, fairyPosition, focusAngleDeg } from './fairy'
import type { ViewBasis } from './fairy'
import { angleDifference, normalizeDegrees } from './geo'
import type { Vec3 } from './gesture'

export type FairyPhase = 'swirl' | 'escape' | 'flee' | 'hidden' | 'befriend' | 'guide'
/** `hey`: her call. `burst`: a shower of sparkles. `move`: she is triggered and starts her next movement. */
export type FairyEvent = 'hey' | 'burst' | 'move'

/** Tunables, see `game/fairy.ts` for what each one does. Seconds, degrees, metres. */
export interface FairyConfig {
  focusConeDeg: number
  focusSeconds: number
  focusGraceSeconds: number
  escapeSeconds: number
  escapeGraceSeconds: number
  escapeSpeedFactor: number
  escapeMaxDegPerSecond: number
  escapeHopSeconds: number
  escapeHopDeg: number
  escapeMaxDodgeDeg: number
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

/** Turns a world vector clockwise around the vertical axis (seen from above), i.e. towards a larger azimuth. */
function rotateAzimuth(v: Vec3, deg: number): Vec3 {
  const a = deg * toRad
  return {
    x: v.x * Math.cos(a) + v.y * Math.sin(a),
    y: -v.x * Math.sin(a) + v.y * Math.cos(a),
    z: v.z
  }
}

/** A small wandering offset of about `meters`, from her own organic path. */
function bob(tau: number, meters: number): Vec3 {
  return scale(fairyPosition(tau * 1.3 + 7), meters / FAIRY_MEAN_RADIUS)
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
 * swirl (focus her for a while) -> escape (she plays, keep her) -> flee, hidden (three times, closer each time) ->
 * befriend -> guide. `skip` jumps to the next stage and `reset` starts over (for testing).
 */
export function createFairyBrain(config: FairyConfig, rng: () => number = Math.random) {
  let phase: FairyPhase = 'swirl'
  let phaseTime = 0
  /** Her swirl clock: it runs faster while she plays, so the path stays continuous. */
  let tau = 0
  let finds = 0
  let hold = 0
  let lost = 0
  let dodge = 0
  let dodgeTarget = 0
  let hopTimer = 0
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

  function enterSwirl() {
    phase = 'swirl'
    phaseTime = 0
    resetHold()
  }

  function enterEscape() {
    phase = 'escape'
    phaseTime = 0
    resetHold()
    hopTimer = 0
    events.push('hey', 'move')
  }

  function startFlee() {
    phase = 'flee'
    phaseTime = 0
    fleeFrom = position
    resetHold()
    events.push('hey', 'move')
  }

  /** She appears behind the player, at the distance of the current round. */
  function placeHidden(view: ViewBasis) {
    const azimuth = azimuthDeg(view.forward) + 180 + (rng() * 2 - 1) * config.hideBehindSpreadDeg
    const elevation = 0.1 + rng() * 0.4
    const radius = config.hideRadii[Math.min(finds, config.hideRadii.length - 1)]
    anchor = sphericalToWorld(azimuth, elevation, radius)
    phase = 'hidden'
    phaseTime = 0
    resetHold()
    blendFrom = null
    jumped = true
    events.push('move')
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
    dodge = 0
    dodgeTarget = 0
    guideAzimuth = null
    blendFrom = null
    resetHold()
    position = fairyPosition(0)
    alpha = 1
    speed = 0
    skipRequested = false
  }

  /** A find in the hide and seek: next round, or the friendship once she was found often enough. */
  function completeFind(view: ViewBasis, skipping: boolean) {
    finds += 1
    if (finds >= config.hideRadii.length) startBefriend()
    else if (skipping) placeHidden(view)
    else startFlee()
  }

  function skipStage(view: ViewBasis) {
    switch (phase) {
      case 'swirl':
        enterEscape()
        break
      case 'escape':
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

  function step(input: BrainInput): BrainOutput {
    const dt = clamp(input.dt, 0, MAX_DT)
    const { view } = input
    events = []
    if (skipRequested) {
      skipRequested = false
      skipStage(view)
    }
    phaseTime += dt

    const canBeFocused = phase === 'swirl' || phase === 'escape' || phase === 'hidden'
    const focused =
      canBeFocused && alpha > 0.6 && focusAngleDeg(view.forward, position) <= config.focusConeDeg

    let next: Vec3 = position
    let nextAlpha = 1
    let loudness = 1
    let glow = 1
    let progress = 0

    switch (phase) {
      case 'swirl': {
        tau += dt
        dodgeTarget = 0
        holdStep(focused, dt, config.focusGraceSeconds)
        if (hold >= config.focusSeconds) enterEscape()
        progress = hold / config.focusSeconds
        break
      }
      case 'escape': {
        tau += dt * config.escapeSpeedFactor
        hopTimer -= dt
        if (hopTimer <= 0) {
          hopTimer = config.escapeHopSeconds * (0.7 + 0.6 * rng())
          const side = rng() < 0.5 ? -1 : 1
          let target = dodgeTarget + side * config.escapeHopDeg
          if (Math.abs(target) > config.escapeMaxDodgeDeg) {
            target = dodgeTarget - side * config.escapeHopDeg
          }
          dodgeTarget = target
        }
        const failed = holdStep(focused, dt, config.escapeGraceSeconds)
        if (failed) enterSwirl()
        else if (hold >= config.escapeSeconds) startFlee()
        progress = hold / config.escapeSeconds
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
      case 'escape': {
        const maxStep = config.escapeMaxDegPerSecond * dt
        dodge += clamp(dodgeTarget - dodge, -maxStep, maxStep)
        next = rotateAzimuth(fairyPosition(tau), dodge)
        glow = 1 + 0.5 * progress
        break
      }
      case 'hidden':
        next = add(anchor, bob(tau, config.hideBobMeters))
        nextAlpha = clamp(phaseTime / config.hideFadeInSeconds, 0, 1)
        glow = 1 + 0.5 * progress
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

    return {
      position,
      alpha,
      glow,
      loudness,
      speed,
      focusProgress: clamp(progress, 0, 1),
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
