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

/**
 * Compass heading (degrees clockwise from north) of what the player looks along while holding the phone at
 * `screenAngle` (`screen.orientation.angle`): the direction of the screen's "up" edge, or of the back camera when the
 * phone is held more upright than flat (then the screen's up edge points at the sky). Unlike `compassHeading` it is
 * right in landscape, where the phone's natural top edge points sideways. The rotation is the W3C
 * alpha/beta/gamma matrix; the device x axis is its first column, y the second, z (out of the screen) the third.
 */
export function screenHeading(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle: number
): number {
  const a = toRad(alpha)
  const b = toRad(beta)
  const g = toRad(gamma)
  const sa = Math.sin(a)
  const ca = Math.cos(a)
  const sb = Math.sin(b)
  const cb = Math.cos(b)
  const sg = Math.sin(g)
  const cg = Math.cos(g)

  // Horizontal (east, north) parts of the device axes.
  const x = { east: ca * cg - sa * sb * sg, north: sa * cg + ca * sb * sg }
  const y = { east: -sa * cb, north: ca * cb }
  const z = { east: ca * sg + sa * sb * cg, north: sa * sg - ca * sb * cg }

  const s = Math.sin(toRad(screenAngle))
  const c = Math.cos(toRad(screenAngle))
  const up = { east: s * x.east + c * y.east, north: s * x.north + c * y.north }
  const back = { east: -z.east, north: -z.north }

  const v = Math.hypot(up.east, up.north) >= Math.hypot(back.east, back.north) ? up : back
  return normalizeDegrees(toDeg(Math.atan2(v.east, v.north)))
}

/** Moves the angle `previous` a fraction `factor` (0..1) of the shortest way to `next`. */
export function smoothAngle(previous: number | null, next: number, factor: number): number {
  if (previous === null) return normalizeDegrees(next)
  return normalizeDegrees(previous + angleDifference(previous, next) * factor)
}

/** True if `heading` points at `bearing` within ±`toleranceDeg`. */
export function isFacing(heading: number, bearing: number, toleranceDeg: number): boolean {
  return Math.abs(angleDifference(heading, bearing)) <= toleranceDeg
}

/** Ground resolution in meters per CSS pixel at a latitude and MapLibre zoom (512 px tiles). */
export function metersPerPixel(lat: number, zoom: number): number {
  return (78271.517 * Math.cos(toRad(lat))) / 2 ** zoom
}
