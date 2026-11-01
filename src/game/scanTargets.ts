import { normalizeCode } from '@/lib/scan'

/**
 * What a scanned target does. Phase one only shows a modal; the sensor mode of the map app comes next as another member
 * (`useScanAction` is the one place that runs them).
 */
export type ScanAction = { type: 'modal'; title: string; text: string }

export interface ScanTarget {
  /** The whole QR payload: the id and nothing else. */
  id: string
  /** Shown beside the code in the scanner. */
  name: string
  action: ScanAction
}

/** Everything the scanner reacts to. Placeholders: set the real ids, names and texts before the hunt. */
export const scanTargets: ScanTarget[] = Array.from({ length: 9 }, (_, i) => ({
  id: `plant-${i + 1}`,
  name: `Pflanze ${i + 1}`,
  action: {
    type: 'modal' as const,
    title: `Pflanze ${i + 1}`,
    text: 'Hier steht später, was die Tafel über diese Pflanze verrät.'
  }
}))

/** The target a raw QR payload points at, or null for foreign or unknown codes. */
export function findTarget(raw: string): ScanTarget | null {
  const id = normalizeCode(raw)
  return scanTargets.find((target) => target.id === id) ?? null
}
