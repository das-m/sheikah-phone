import { ref } from 'vue'

import type { SensorEvent } from '@/game/sensors'

// Module-level, like `useYigaMode`: the sensor is chosen in the scanner and used on the map, and it stays active when
// the map is left (it only beeps while the map is open). Not persisted.
const active = ref<SensorEvent | null>(null)

/** The sensor the player selected, null when none is active. */
export function useSensorMode() {
  /** Replaces the active sensor, if any. */
  function activate(sensor: SensorEvent) {
    active.value = sensor
  }

  function deactivate() {
    active.value = null
  }

  return { active, activate, deactivate }
}
