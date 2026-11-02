import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useSensorMode } from '@/composables/useSensorMode'
import type { ScanTarget } from '@/game/scanTargets'
import { findSensor, type SensorEvent } from '@/game/sensors'

export interface ScanModalContent {
  /** The entry number shown before the title (the sensor event's id). */
  number?: string
  title: string
  text: string
  /** Asset URL of a picture. */
  image?: string
  /** "Common locations" line of a sensor event. */
  locations?: string
  /** Why a sensor event cannot be selected. */
  statusText?: string
  /** Offers "Auswählen" (sensor events that are available). */
  selectable: boolean
}

/** A compile error here means an action type was added to `ScanAction` and not handled in `run`. */
function assertNever(type: never): never {
  throw new Error(`Unhandled scan action: ${String(type)}`)
}

function sensorModal(sensor: SensorEvent): ScanModalContent {
  const available = sensor.status === 'available'
  return {
    number: sensor.id,
    title: sensor.name,
    text: sensor.description,
    image: sensor.image,
    locations: sensor.commonLocations,
    statusText: available ? undefined : sensor.statusText,
    selectable: available
  }
}

/** Runs what a scanned target asks for. The one place a new action type plugs in. */
export function useScanAction() {
  const router = useRouter()
  const { activate } = useSensorMode()
  const modal = ref<ScanModalContent | null>(null)
  let pending: SensorEvent | null = null

  function run(target: ScanTarget) {
    const { action } = target
    switch (action.type) {
      case 'modal':
        pending = null
        modal.value = { title: action.title, text: action.text, selectable: false }
        break
      case 'sensor': {
        const sensor = findSensor(action.sensorId)
        if (!sensor) return
        pending = sensor.status === 'available' ? sensor : null
        modal.value = sensorModal(sensor)
        break
      }
      default:
        assertNever(action)
    }
  }

  function close() {
    modal.value = null
    pending = null
  }

  /** "Auswählen": the sensor becomes the active one and the map opens (it starts beeping there). */
  function select() {
    if (!pending) return
    activate(pending)
    close()
    router.push({ name: 'map' })
  }

  return { modal, run, close, select }
}
