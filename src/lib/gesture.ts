const GRAVITY = 9.81

/** Fraction of gravity on the device y axis (negative = top of the phone points down) to enter / leave "flipped". */
const FLIP_ENTER = -0.7
const FLIP_EXIT = -0.4

export interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * Whether the phone is held head-down (upside down in portrait), from `accelerationIncludingGravity`.
 * Hysteresis: it must clearly tip over to count and clearly come back to stop counting.
 */
export function isFlipped(gravity: Vec3, wasFlipped: boolean): boolean {
  const magnitude = Math.hypot(gravity.x, gravity.y, gravity.z)
  // Free fall or a bad reading: keep the previous state.
  if (magnitude < GRAVITY * 0.5) return wasFlipped
  const yFraction = gravity.y / magnitude
  return yFraction < (wasFlipped ? FLIP_EXIT : FLIP_ENTER)
}

/** How hard the phone is being moved, in m/s²: the deviation of the total acceleration from plain gravity. */
export function motionIntensity(accelerationIncludingGravity: Vec3): number {
  const { x, y, z } = accelerationIncludingGravity
  return Math.abs(Math.hypot(x, y, z) - GRAVITY)
}

export interface ShakeOptions {
  /** Intensity (m/s²) a sample needs to count as a peak. */
  threshold: number
  /** Peaks needed within `windowMs` to count as a shake. */
  minPeaks: number
  windowMs: number
  /** Samples closer together than this belong to the same peak. */
  minGapMs: number
  /** After a shake, ignore input for this long. */
  cooldownMs: number
}

export const defaultShakeOptions: ShakeOptions = {
  threshold: 14,
  minPeaks: 4,
  windowMs: 1200,
  minGapMs: 80,
  cooldownMs: 1500
}

/** Feed it intensity samples; `push` returns true once per shake. */
export function createShakeDetector(options: Partial<ShakeOptions> = {}) {
  const { threshold, minPeaks, windowMs, minGapMs, cooldownMs } = {
    ...defaultShakeOptions,
    ...options
  }
  let peaks: number[] = []
  let blockedUntil = -Infinity

  return {
    push(intensity: number, timeMs: number): boolean {
      if (timeMs < blockedUntil || intensity < threshold) return false
      if (peaks.length > 0 && timeMs - peaks[peaks.length - 1] < minGapMs) return false
      peaks = peaks.filter((t) => timeMs - t <= windowMs)
      peaks.push(timeMs)
      if (peaks.length < minPeaks) return false
      peaks = []
      blockedUntil = timeMs + cooldownMs
      return true
    },
    reset() {
      peaks = []
      blockedUntil = -Infinity
    }
  }
}
