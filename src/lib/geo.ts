export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6371000

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Wraps any angle into [0, 360). */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Shortest signed difference `to - from` in degrees, in [-180, 180). */
export function angleDifference(from: number, to: number): number {
  return normalizeDegrees(to - from + 180) - 180
}

/** Great-circle distance in meters (haversine). */
export function distanceMeters(from: LatLng, to: LatLng): number {
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Initial bearing from `from` to `to`: degrees clockwise from true north, in [0, 360). */
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const phi1 = toRad(from.lat)
  const phi2 = toRad(to.lat)
  const dLambda = toRad(to.lng - from.lng)
  const y = Math.sin(dLambda) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda)
  return normalizeDegrees(toDeg(Math.atan2(y, x)))
}

/**
 * Compass heading (degrees clockwise from north) from a DeviceOrientationEvent's alpha/beta/gamma.
 *
 * Held flat or tilted back (|beta| < 45): the direction the top edge of the phone points to.
 * Held upright (|beta| >= 45): the direction the back camera points to.
 * The upright case is the W3C worked example, https://w3c.github.io/deviceorientation/#worked-example,
 * which is undefined for a flat device (the back then points at the ground).
 */
export function compassHeading(alpha: number, beta: number, gamma: number): number {
  if (Math.abs(beta) < 45) return normalizeDegrees(-alpha)

  const a = toRad(alpha)
  const b = toRad(beta)
  const g = toRad(gamma)

  const rA = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g)
  const rB = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g)

  return normalizeDegrees(toDeg(Math.atan2(rA, rB)))
}

/** True if `heading` points at `bearing` within ±`toleranceDeg`. */
export function isFacing(heading: number, bearing: number, toleranceDeg: number): boolean {
  return Math.abs(angleDifference(heading, bearing)) <= toleranceDeg
}

export interface BeepRange {
  /** At or below this distance (m) the beep rate is at its fastest. */
  nearMeters: number
  /** At or above this distance (m) the beep rate is at its slowest. */
  farMeters: number
  fastIntervalMs: number
  slowIntervalMs: number
}

/** Delay between two beeps: linear between the fast and slow interval over the distance range. */
export function beepIntervalMs(distance: number, range: BeepRange): number {
  const { nearMeters, farMeters, fastIntervalMs, slowIntervalMs } = range
  const t = Math.min(1, Math.max(0, (distance - nearMeters) / (farMeters - nearMeters)))
  return fastIntervalMs + t * (slowIntervalMs - fastIntervalMs)
}
