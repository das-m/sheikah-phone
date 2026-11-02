import { onUnmounted, ref } from 'vue'

/** The screen's rotation in degrees (`screen.orientation.angle`), kept current; 0 where the API is missing. */
export function useScreenAngle() {
  const orientation = typeof screen === 'undefined' ? undefined : screen.orientation
  const angle = ref(orientation?.angle ?? 0)

  function update() {
    angle.value = orientation?.angle ?? 0
  }

  orientation?.addEventListener('change', update)
  onUnmounted(() => orientation?.removeEventListener('change', update))

  return angle
}
