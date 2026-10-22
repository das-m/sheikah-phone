import type { BeepRange, LatLng } from '@/lib/geo'

/** What the Sheikah Sensor currently points at. Placeholder: Residenzschloss Ludwigsburg. */
export const sensorTarget: { name: string; position: LatLng } = {
  name: 'Residenzschloss',
  position: { lat: 48.899614, lng: 9.195613 }
}

/** Beep timing: the closer, the faster. Heading bonus applies when the phone points at the target. */
export const beepRange: BeepRange = {
  nearMeters: 10,
  farMeters: 500,
  fastIntervalMs: 400,
  slowIntervalMs: 3000
}

/** Half-angle (degrees) within which the phone counts as pointing at the target. */
export const facingToleranceDeg = 30

/** Volume when the phone does not point at the target (1 when it does). */
export const offCourseVolume = 0.4
