import { sensors } from '@/game/sensors'
import { boxFromLayout, normalizeCode, type FrameBox } from '@/lib/scan'

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
  /** What the scanner frames, relative to the code. Default: a little more than the code (`aroundCode`). */
  frame?: FrameBox
}

/** The frame of a target that is just a code: a little larger than the code, centered on it. */
export const aroundCode: FrameBox = { x: -0.175, y: -0.175, width: 1.35, height: 1.35 }

/** The cards, in mm: 63.5 x 88, a code centered at the top. */
const CARD_MM = { width: 63.5, height: 88 }
/**
 * Side of the printed code, finder pattern edge to edge (not the quiet zone), and its distance from the card's top edge.
 * Placeholders until the size test (`scripts/qr-sheet.mjs`) settles how small the code can be: change them here and the
 * frame follows.
 */
const CODE_MM = 15
const CODE_TOP_MM = 5

/** The frame of a card: its whole outline, found from the code in its top center. */
export const cardFrame: FrameBox = boxFromLayout({
  card: CARD_MM,
  codeSize: CODE_MM,
  codeTop: CODE_TOP_MM
})

/**
 * Everything the scanner reacts to: one target per sensor event (`game/sensors.ts` is where the content is edited).
 * Ids are short digit strings: that keeps every code at QR version 1 (21x21 modules) with the strongest error
 * correction, the smallest size a QR code has. They are strings, `01` is not `1`.
 */
export const scanTargets: ScanTarget[] = sensors.map((sensor) => ({
  id: sensor.id,
  name: sensor.name,
  action: { type: 'sensor', sensorId: sensor.id },
  frame: cardFrame
}))

/** The target a raw QR payload points at, or null for foreign or unknown codes. */
export function findTarget(raw: string): ScanTarget | null {
  const id = normalizeCode(raw)
  return scanTargets.find((target) => target.id === id) ?? null
}
