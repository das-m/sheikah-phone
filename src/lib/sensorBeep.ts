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
  /** The interval is multiplied by this while the phone points straight at the target (< 1: faster). */
  centerIntervalFactor: number
  /** The aim error (degrees) at which the interval factor has grown back to 1: the edge of the cone. */
  aimEdgeDeg: number
  /** Volume at `farMeters` and at `nearMeters`, 0..1. `farVolume` is the cap for far targets: quiet, but audible. */
  farVolume: number
  nearVolume: number
  /**
   * The found radius follows the GPS accuracy (a fix that is 20 m off cannot say "10 m"), clamped to this range, in
   * metres. Closer than it the target is found: full volume and `foundIntervalMs`, whichever way the phone points.
   */
  foundMinMeters: number
  foundMaxMeters: number
  foundIntervalMs: number
}

function closeness(distance: number, tuning: BeepTuning): number {
  const span = Math.max(1e-6, tuning.farMeters - tuning.nearMeters)
  const t = (distance - tuning.nearMeters) / span
  return Math.min(1, Math.max(0, t))
}

/** The radius (metres) inside which the target counts as reached, from the accuracy of the GPS fix (null: unknown). */
export function foundRadius(accuracy: number | null, tuning: BeepTuning): number {
  const radius = accuracy ?? tuning.foundMinMeters
  return Math.min(tuning.foundMaxMeters, Math.max(tuning.foundMinMeters, radius))
}

/** The target is as good as reached: the beep turns into the rapid "found" pulse. */
export function isFound(distance: number, radius: number): boolean {
  return distance <= radius
}

/**
 * Time from one beep to the next, in ms. `offsetDeg` is how far the phone points past the target (0 = straight at it);
 * it makes the beeps up to `1 / centerIntervalFactor` times faster the better the aim, fading out with the distance.
 */
export function beepIntervalMs(
  distance: number,
  offsetDeg: number,
  radius: number,
  tuning: BeepTuning
): number {
  if (isFound(distance, radius)) return tuning.foundIntervalMs
  const t = closeness(distance, tuning) ** tuning.curve
  const interval = tuning.fastIntervalMs + (tuning.slowIntervalMs - tuning.fastIntervalMs) * t
  // The aim only quickens the beeps the closer you are: far away, pointing straight at it stays calm.
  const off = Math.min(1, Math.abs(offsetDeg) / Math.max(1e-6, tuning.aimEdgeDeg))
  const bonus = (1 - tuning.centerIntervalFactor) * (1 - off) * (1 - closeness(distance, tuning))
  return interval * (1 - bonus)
}

/** Volume of a beep, 0..1. */
export function beepVolume(distance: number, radius: number, tuning: BeepTuning): number {
  if (isFound(distance, radius)) return tuning.nearVolume
  const t = closeness(distance, tuning)
  return tuning.nearVolume + (tuning.farVolume - tuning.nearVolume) * t
}

/** The beep only sounds while the phone points at the target, except inside the found radius. */
export function isBeepAudible(distance: number, facing: boolean, radius: number): boolean {
  return facing || isFound(distance, radius)
}

/** A rounded distance for the HUD, always in metres: "ca. 1300 m". */
export function formatApproxDistance(meters: number): string {
  const step = meters < 50 ? 5 : meters < 200 ? 10 : meters < 1000 ? 50 : 100
  const rounded = Math.max(step, Math.round(meters / step) * step)
  return `ca. ${rounded} m`
}
