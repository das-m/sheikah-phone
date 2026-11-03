import { angleDifference } from '@/lib/geo'

/**
 * The map bearing for the next frame while the map turns to the player's heading: a fraction `factor` (0..1) of the
 * shortest way from `current` to `target` (both in degrees, `current` may be any angle MapLibre reports), or `current`
 * itself while the remaining difference is within `deadbandDeg` (the compass jitters, the whole map must not).
 */
export function nextBearing(
  current: number,
  target: number,
  factor: number,
  deadbandDeg: number
): number {
  const difference = angleDifference(current, target)
  if (Math.abs(difference) <= deadbandDeg) return current
  return current + difference * factor
}
