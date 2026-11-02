import { computed, ref } from 'vue'

import type { SensorEvent } from '@/game/sensors'

// Module-level, like `useYigaMode`: the sensor is chosen in the scanner and used on the map, and it stays active when
// the map is left (it only beeps while the map is open). Not persisted.
// The last sensor the player activated. It stays until another one is activated, also while it is switched off, so
// the HUD can switch it on again. The map only shows the HUD once there is one, so that it does not give away that
// there is a sensor before the player found the first one.
const selected = ref<SensorEvent | null>(null)
const enabled = ref(false)
// What the beeper and the HUD work with: the selected sensor while it is switched on.
const active = computed(() => (enabled.value ? selected.value : null))

export function useSensorMode() {
  /** Replaces the selected sensor, if any, and switches it on. */
  function activate(sensor: SensorEvent) {
    selected.value = sensor
    enabled.value = true
  }

  /** Switches the selected sensor on or off. Does nothing before one was selected. */
  function toggle() {
    if (selected.value) enabled.value = !enabled.value
  }

  return { selected, active, activate, toggle }
}
