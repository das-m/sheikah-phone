import { onMounted, onUnmounted } from 'vue'
import type { Orientation } from '@/lib/fairy'
import { compassHeading } from '@/lib/geo'
import { createNorthOffsetTracker } from '@/lib/northOffset'

/** A relative and an absolute reading count as simultaneous when they are this close together (ms). */
const MAX_READING_GAP_MS = 100

/**
 * Latest device orientation (degrees), or null until the first reading.
 * Plain object, not reactive: it changes up to 60 times a second and is meant to be read from an animation frame loop.
 * Uses the relative `deviceorientation` (no compass jitter); Android Chrome needs no permission.
 * Its zero direction is arbitrary, so the absolute `deviceorientationabsolute` is read as well, only to learn how far the
 * relative north is off the real one: `northOffset` (degrees, or null until known), see `lib/northOffset.ts`.
 */
export function useOrientation() {
  const tracker = createNorthOffsetTracker()
  let absolute: { heading: number; time: number } | null = null
  const state: { current: Orientation | null; readonly northOffset: number | null } = {
    current: null,
    get northOffset() {
      return tracker.value
    }
  }

  function onRelative(event: DeviceOrientationEvent) {
    const { alpha, beta, gamma } = event
    if (alpha === null || beta === null || gamma === null) return
    state.current = { alpha, beta, gamma }
    if (absolute && Math.abs(event.timeStamp - absolute.time) <= MAX_READING_GAP_MS) {
      tracker.push(absolute.heading, compassHeading(alpha, beta, gamma))
    }
  }

  function onAbsolute(event: DeviceOrientationEvent) {
    const { alpha, beta, gamma } = event
    if (alpha === null || beta === null || gamma === null) return
    absolute = { heading: compassHeading(alpha, beta, gamma), time: event.timeStamp }
  }

  onMounted(() => {
    window.addEventListener('deviceorientation', onRelative)
    window.addEventListener('deviceorientationabsolute', onAbsolute as EventListener)
  })

  onUnmounted(() => {
    window.removeEventListener('deviceorientation', onRelative)
    window.removeEventListener('deviceorientationabsolute', onAbsolute as EventListener)
  })

  return state
}
