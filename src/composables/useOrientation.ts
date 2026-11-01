import { onMounted, onUnmounted } from 'vue'
import type { Orientation } from '@/lib/fairy'

/**
 * Latest device orientation (degrees), or null until the first reading.
 * Plain object, not reactive: it changes up to 60 times a second and is meant to be read from an animation frame loop.
 * Uses the relative `deviceorientation` (no compass jitter); Android Chrome needs no permission.
 */
export function useOrientation() {
  const state: { current: Orientation | null } = { current: null }

  function onOrientation(event: DeviceOrientationEvent) {
    const { alpha, beta, gamma } = event
    if (alpha === null || beta === null || gamma === null) return
    state.current = { alpha, beta, gamma }
  }

  onMounted(() => {
    window.addEventListener('deviceorientation', onOrientation)
  })

  onUnmounted(() => {
    window.removeEventListener('deviceorientation', onOrientation)
  })

  return state
}
