import { onMounted, onUnmounted, ref } from 'vue'
import { useScreenAngle } from '@/composables/useScreenAngle'
import { screenHeading, smoothAngle } from '@/lib/geo'

/** How far each reading pulls the shown heading (0..1): calms the magnetic noise. A first guess, tune on a phone. */
const SMOOTHING = 0.2

/**
 * Compass heading in degrees clockwise from north of what the player looks along (the screen's up edge, or the back
 * camera when the phone is held upright; right in landscape too), smoothed, or null until the first reading.
 * Android Chrome only: uses `deviceorientationabsolute` (no iOS permission flow).
 */
export function useHeading() {
  const heading = ref<number | null>(null)
  const screenAngle = useScreenAngle()

  function onOrientation(event: DeviceOrientationEvent) {
    const { alpha, beta, gamma } = event
    if (alpha === null || beta === null || gamma === null) return
    heading.value = smoothAngle(
      heading.value,
      screenHeading(alpha, beta, gamma, screenAngle.value),
      SMOOTHING
    )
  }

  onMounted(() => {
    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener, true)
  })

  onUnmounted(() => {
    window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener, true)
  })

  return { heading }
}
