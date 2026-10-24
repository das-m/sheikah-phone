import { parseToken } from '@/lib/lens'

export interface LensTarget {
  /** Second and third part of the QR payload: `sheikah:<kind>:<id>`. */
  kind: 'plant'
  id: string
  /** Shown in the lens when the code is scanned. */
  name: string
}

/** Everything the Sheikah Lens reacts to. Placeholder names: set the real ones before the hunt. */
export const lensTargets: LensTarget[] = Array.from({ length: 9 }, (_, i) => ({
  kind: 'plant' as const,
  id: `plant-${i + 1}`,
  name: `Pflanze ${i + 1}`
}))

/** The target a raw QR payload points at, or null for foreign or unknown codes. */
export function findTarget(raw: string): LensTarget | null {
  const token = parseToken(raw)
  if (!token) return null
  return lensTargets.find((t) => t.kind === token.kind && t.id === token.id) ?? null
}

/** The QR payload to print for a target. */
export function tokenFor(target: LensTarget): string {
  return `sheikah:${target.kind}:${target.id}`
}
