import { computed, ref, watch } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useMotion } from '@/composables/useMotion'
import { useYigaMode } from '@/composables/useYigaMode'
import { yigaZone } from '@/game/zones'
import { isInsideZone } from '@/lib/zone'

/**
 * Wires zone + flip + shake to the mode switch. Mount once, in `App.vue`.
 * Enter: inside the zone, phone flipped, shake. Reset: shake, anywhere.
 */
export function useYigaTrigger() {
  const { mode, forceInZone, enter, reset } = useYigaMode()
  const { position, accuracy } = useGeolocation()

  const isInZone = ref(false)
  watch([position, accuracy], () => {
    if (!position.value) return
    isInZone.value = isInsideZone(position.value, yigaZone, isInZone.value, accuracy.value ?? 0)
  })

  const inZone = computed(() => isInZone.value || forceInZone.value)
  const motionActive = computed(() => inZone.value || mode.value === 'yiga')

  const { flipped, intensity } = useMotion(motionActive, (wasFlipped) => {
    if (mode.value === 'yiga') reset()
    else if (inZone.value && wasFlipped) enter()
  })

  return { inZone, flipped, intensity }
}
