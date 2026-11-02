import { sensors } from '@/game/sensors'
import { normalizeCode, type FrameBox } from '@/lib/scan'

/**
 * What a scanned target does (`useScanAction` is the one place that runs them): `modal` shows a text, `sensor` offers
 * the sensor event of `game/sensors.ts` (select it and the map's sensor mode starts).
 */
export type ScanAction =
  { type: 'modal'; title: string; text: string } | { type: 'sensor'; sensorId: string }

export interface ScanTarget {
  /** The whole QR payload: the id and nothing else. Digits only, see `scanTargets`. */
  id: string
  /** Shown beside the code in the scanner. */
  name: string
  action: ScanAction
}

/** The square the scanner draws on a code: a little larger than the code, centered on it. */
export const aroundCode: FrameBox = { x: -0.175, y: -0.175, width: 1.35, height: 1.35 }

/**
 * Everything the scanner reacts to: one target per sensor event (`game/sensors.ts` is where the content is edited).
 * Ids are short digit strings: that keeps every code at QR version 1 (21x21 modules) with the strongest error
 * correction, the smallest size a QR code has. They are strings, `01` is not `1`.
 */
export const scanTargets: ScanTarget[] = sensors.map((sensor) => ({
  id: sensor.id,
  name: sensor.name,
  action: { type: 'sensor', sensorId: sensor.id }
}))

/** The target a raw QR payload points at, or null for foreign or unknown codes. */
export function findTarget(raw: string): ScanTarget | null {
  const id = normalizeCode(raw)
  return scanTargets.find((target) => target.id === id) ?? null
}
