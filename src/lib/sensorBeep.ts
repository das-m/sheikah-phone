/**
 * How the sensor beeps, from where the target is. No formal standard exists: parking sensors, Geiger counters and
 * avalanche beacons all do the same, the beeps get faster (and louder) the closer you get, up to a near-continuous
 * tone. All numbers are tunables (`sensorTuning` in `game/sensors.ts`), to be tuned on a real phone.
 */
export interface BeepTuning {
  /** At or closer than this, the interval is `fastIntervalMs` (metres). */
  nearMeters: number
  /** At or farther than this, the interval is `slowIntervalMs` (metres). */
  farMeters: number
  fastIntervalMs: number
  slowIntervalMs: number
  /**
   * Shape of the interval between near and far, 0..1 maps to 0..1 through `t ** curve`. Below 1 the rhythm changes
   * more when close, which is where the player wants to feel "warmer".
   */
  curve: number
  /** The interval is multiplied by this while the phone points at the target (< 1: faster). */
  facingIntervalFactor: number
  /** Volume at `farMeters` and at `nearMeters`, 0..1. `farVolume` is the cap for far targets: quiet, but audible. */
  farVolume: number
  nearVolume: number
  /** Closer than this the target is found: full volume and `foundIntervalMs`, whichever way the phone points. */
  foundMeters: number
  foundIntervalMs: number
}

function closeness(distance: number, tuning: BeepTuning): number {
  const span = Math.max(1e-6, tuning.farMeters - tuning.nearMeters)
  const t = (distance - tuning.nearMeters) / span
  return Math.min(1, Math.max(0, t))
}

/** The target is as good as reached: the beep turns into the rapid "found" pulse. */
export function isFound(distance: number, tuning: BeepTuning): boolean {
  return distance <= tuning.foundMeters
}

/** Time from one beep to the next, in ms. */
export function beepIntervalMs(distance: number, facing: boolean, tuning: BeepTuning): number {
  if (isFound(distance, tuning)) return tuning.foundIntervalMs
  const t = closeness(distance, tuning) ** tuning.curve
  const interval = tuning.fastIntervalMs + (tuning.slowIntervalMs - tuning.fastIntervalMs) * t
  return facing ? interval * tuning.facingIntervalFactor : interval
}

/** Volume of a beep, 0..1. */
export function beepVolume(distance: number, tuning: BeepTuning): number {
  if (isFound(distance, tuning)) return tuning.nearVolume
  const t = closeness(distance, tuning)
  return tuning.nearVolume + (tuning.farVolume - tuning.nearVolume) * t
}

/** The beep only sounds while the phone points at the target, except inside the found radius. */
export function isBeepAudible(distance: number, facing: boolean, tuning: BeepTuning): boolean {
  return facing || isFound(distance, tuning)
}

/** A rounded distance for the HUD, always in metres: "ca. 1300 m". */
export function formatApproxDistance(meters: number): string {
  const step = meters < 50 ? 5 : meters < 200 ? 10 : meters < 1000 ? 50 : 100
  const rounded = Math.max(step, Math.round(meters / step) * step)
  return `ca. ${rounded} m`
}
