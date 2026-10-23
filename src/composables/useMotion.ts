import { onUnmounted, ref, watch, type Ref } from 'vue'
import { createShakeDetector, isFlipped, motionIntensity } from '@/lib/gesture'

/** Shaking disturbs the gravity reading, so a flip counts for this long after it was last seen. */
const FLIP_GRACE_MS = 1500

/**
 * Flip and shake detection from `devicemotion` (Android Chrome needs no permission). `onShake` says whether the phone was flipped around then.
 * The listener only runs while `active` is true, to spare the battery.
 */
export function useMotion(active: Ref<boolean>, onShake: (wasFlipped: boolean) => void) {
  const flipped = ref(false)
  const intensity = ref(0)
  const detector = createShakeDetector()
  let lastFlippedAt = -Infinity

  function onMotion(event: DeviceMotionEvent) {
    const g = event.accelerationIncludingGravity
    if (!g || g.x === null || g.y === null || g.z === null) return
    const gravity = { x: g.x, y: g.y, z: g.z }
    flipped.value = isFlipped(gravity, flipped.value)
    if (flipped.value) lastFlippedAt = event.timeStamp
    intensity.value = motionIntensity(gravity)
    if (detector.push(intensity.value, event.timeStamp)) {
      onShake(event.timeStamp - lastFlippedAt < FLIP_GRACE_MS)
    }
  }

  function detach() {
    window.removeEventListener('devicemotion', onMotion)
    detector.reset()
    lastFlippedAt = -Infinity
    flipped.value = false
    intensity.value = 0
  }

  watch(
    active,
    (isActive) => {
      if (isActive) window.addEventListener('devicemotion', onMotion)
      else detach()
    },
    { immediate: true }
  )

  onUnmounted(detach)

  return { flipped, intensity }
}
