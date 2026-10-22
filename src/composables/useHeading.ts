import { onMounted, onUnmounted, ref } from 'vue'
import { compassHeading } from '@/lib/geo'

/**
 * Compass heading in degrees clockwise from north, or null until the first reading.
 * Android Chrome only: uses `deviceorientationabsolute` (no iOS permission flow).
 */
export function useHeading() {
  const heading = ref<number | null>(null)

  function onOrientation(event: DeviceOrientationEvent) {
    const { alpha, beta, gamma } = event
    if (alpha === null || beta === null || gamma === null) return
    heading.value = compassHeading(alpha, beta, gamma)
  }

  onMounted(() => {
    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener, true)
  })

  onUnmounted(() => {
    window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener, true)
  })

  return { heading }
}
