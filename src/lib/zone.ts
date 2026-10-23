import { distanceMeters, type LatLng } from './geo'

export interface Zone {
  center: LatLng
  radiusMeters: number
}

/** Leaving needs this much more distance than entering, so the edge does not flicker with GPS noise. */
export const ZONE_EXIT_FACTOR = 1.3

/**
 * Whether `position` is inside `zone`, with hysteresis: enter at the radius, leave at radius * ZONE_EXIT_FACTOR.
 * A poor GPS fix (large `accuracyMeters`) counts in the player's favour.
 */
export function isInsideZone(
  position: LatLng,
  zone: Zone,
  wasInside: boolean,
  accuracyMeters = 0
): boolean {
  const distance = Math.max(0, distanceMeters(position, zone.center) - accuracyMeters)
  const limit = wasInside ? zone.radiusMeters * ZONE_EXIT_FACTOR : zone.radiusMeters
  return distance <= limit
}
