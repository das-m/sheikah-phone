import { angleDifference, normalizeDegrees } from './geo'

/**
 * The relative `deviceorientation` is smooth but its zero is arbitrary; the absolute one points at the real north.
 * This tracks `absolute heading - relative heading` (degrees, in [0, 360)) with a circular low-pass, so a compass bearing
 * `b` becomes `b - offset` in the relative frame. `value` is null until the first sample.
 */
export function createNorthOffsetTracker(smoothing = 0.05) {
  let offset: number | null = null

  return {
    push(absoluteHeading: number, relativeHeading: number) {
      const sample = angleDifference(relativeHeading, absoluteHeading)
      offset =
        offset === null
          ? normalizeDegrees(sample)
          : normalizeDegrees(offset + smoothing * angleDifference(offset, sample))
    },
    get value(): number | null {
      return offset
    },
    reset() {
      offset = null
    }
  }
}
