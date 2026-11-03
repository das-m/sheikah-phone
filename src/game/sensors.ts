import type { LatLng } from '@/lib/geo'
import type { BeepTuning } from '@/lib/sensorBeep'

/**
 * `available`: the sensor can be selected. `unavailable`: it cannot (extinct, out of season ...), the modal only offers
 * "Zurück" and `statusText` says why.
 */
export type SensorStatus = 'available' | 'unavailable'

/** What a scanned QR code stands for. The id is the QR payload (see `scanTargets.ts`). */
export interface SensorEvent {
  /** The whole QR payload: digits only, a string (`01` is not `1`). */
  id: string
  name: string
  /** Asset URL (import it at the top, like the map icons), shown in the modal. Optional. */
  image?: string
  description: string
  /** Where it is usually found, as text for the player. */
  commonLocations: string
  status: SensorStatus
  /** Why it is not available, shown in the modal. */
  statusText?: string
  /**
   * Where the sensor points to. Without it the sensor can still be selected (the icon shows on the map) but stays
   * silent: nothing to measure.
   */
  location?: LatLng
}

/**
 * The one file to edit for the content of the sensor events. Placeholders: set the real texts and places before the hunt.
 * The scanner gets its targets from here (`game/scanTargets.ts`): one per event, the QR code of `id` triggers it.
 */
export const sensors: SensorEvent[] = [
  {
    id: '01',
    name: 'Pflanze 1',
    description: 'Hier steht später, was die Tafel über dieses Ereignis verrät.',
    commonLocations: 'Rund um das Residenzschloss.',
    status: 'available',
    location: { lat: 48.7802009, lng: 9.1792001 }
  },
  {
    id: '02',
    name: 'Pflanze 2',
    description: 'Hier steht später, was die Tafel über dieses Ereignis verrät.',
    commonLocations: 'In der Nähe des Marktplatzes.',
    status: 'available',
    location: { lat: 48.8947, lng: 9.192 }
  },
  {
    id: '03',
    name: 'Pflanze 3',
    description: 'Hier steht später, was die Tafel über dieses Ereignis verrät.',
    commonLocations: 'Nur im Sommer zu finden.',
    status: 'unavailable',
    statusText: 'Außerhalb der Saison.'
  },
  ...Array.from({ length: 6 }, (_, i): SensorEvent => {
    const n = i + 4
    return {
      id: String(n).padStart(2, '0'),
      name: `Pflanze ${n}`,
      description: 'Hier steht später, was die Tafel über dieses Ereignis verrät.',
      commonLocations: 'Hier steht später, wo man sie findet.',
      status: 'available'
    }
  })
]

/** The sensor event of a QR id, or null. */
export function findSensor(id: string): SensorEvent | null {
  return sensors.find((sensor) => sensor.id === id) ?? null
}

/** How the sensor beeps (see `lib/sensorBeep.ts`). Untested on a real phone: tune there. */
export const sensorTuning: BeepTuning = {
  nearMeters: 10,
  farMeters: 500,
  fastIntervalMs: 300,
  slowIntervalMs: 2500,
  curve: 0.6,
  facingIntervalFactor: 0.7,
  farVolume: 0.25,
  nearVolume: 1,
  offCourseVolume: 0.5,
  foundMeters: 10,
  foundIntervalMs: 250
}

/** The phone counts as pointing at the target within this angle (degrees). */
export const SENSOR_FACING_TOLERANCE_DEG = 30
