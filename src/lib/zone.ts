import { distanceMeters, type LatLng } from './geo'

export interface Zone {
  center: LatLng
  radiusMeters: number
}

/** Leaving needs this much more distance than entering, so the edge does not flicker with GPS noise. */
export const ZONE_EXIT_FACTOR = 1.3

/** A poor fix may count in the player's favour, but only up to this share of the radius: a coarse fix must not unlock the zone from afar. */
export const MAX_ACCURACY_CREDIT = 0.5

/**
 * Whether `position` is inside `zone`, with hysteresis: enter at the radius, leave at radius * ZONE_EXIT_FACTOR.
 * A poor GPS fix (large `accuracyMeters`) counts in the player's favour, capped at MAX_ACCURACY_CREDIT * radius.
 */
export function isInsideZone(
  position: LatLng,
  zone: Zone,
  wasInside: boolean,
  accuracyMeters = 0
): boolean {
  const credit = Math.min(accuracyMeters, zone.radiusMeters * MAX_ACCURACY_CREDIT)
  const distance = Math.max(0, distanceMeters(position, zone.center) - credit)
  const limit = wasInside ? zone.radiusMeters * ZONE_EXIT_FACTOR : zone.radiusMeters
  return distance <= limit
}
