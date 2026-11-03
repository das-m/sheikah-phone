import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useHeading } from '@/composables/useHeading'
import { angleDifference, bearingDegrees, distanceMeters, isFacing } from '@/lib/geo'
import type { LatLng } from '@/lib/geo'

/**
 * Where a target is, seen from here: the GPS position, the compass heading and the maths between them.
 * No game logic in it, so the fairy guide, the map's sensor mode and the Sensor app can all use it.
 * Every value is null until the sensors report (no GPS fix, no heading).
 *
 * - `accuracy`: horizontal accuracy of the GPS fix in metres.
 * - `distance`: metres to the target.
 * - `bearing`: degrees clockwise from true north from here to the target.
 * - `heading`: degrees clockwise from north the phone points to (see `useHeading`).
 * - `relativeBearing`: where the target is relative to the phone, in [-180, 180): 0 straight ahead, positive to the right.
 * - `isFacingTarget`: the phone points at the target within `toleranceDeg`.
 */
export function useCompass(target: MaybeRefOrGetter<LatLng>, toleranceDeg = 30) {
  const { position, accuracy, error, isSupported } = useGeolocation()
  const { heading } = useHeading()

  const distance = computed(() =>
    position.value ? distanceMeters(position.value, toValue(target)) : null
  )
  const bearing = computed(() =>
    position.value ? bearingDegrees(position.value, toValue(target)) : null
  )
  const relativeBearing = computed(() =>
    bearing.value !== null && heading.value !== null
      ? angleDifference(heading.value, bearing.value)
      : null
  )
  const isFacingTarget = computed(() =>
    bearing.value !== null && heading.value !== null
      ? isFacing(heading.value, bearing.value, toleranceDeg)
      : false
  )

  return {
    position,
    accuracy,
    error,
    isSupported,
    distance,
    bearing,
    heading,
    relativeBearing,
    isFacingTarget
  }
}
